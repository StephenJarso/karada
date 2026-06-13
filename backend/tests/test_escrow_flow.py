import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

fd, db_path = tempfile.mkstemp(suffix=".db")
os.close(fd)
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ["LND_MOCK"] = "true"

from fastapi.testclient import TestClient  # noqa: E402
from app.api import app  # noqa: E402


class EscrowFlowTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        try:
            Path(db_path).unlink(missing_ok=True)
        except OSError:
            pass

    def test_all_product_families_settle(self):
        cases = [
            ("COMMERCE", "DHL-DEMO-1", "COURIER_TRACKING"),
            ("SCHOOL_FEES", "SF-DEMO-1", "SCHOOL_DOCUMENT"),
            ("SAVINGS", "SAVE-DEMO-1", "SAVINGS_LOCK"),
        ]

        for product_type, reference, proof_type in cases:
            with self.subTest(product_type=product_type):
                create = self.client.post(
                    "/api/v1/escrow",
                    json={
                        "amount_sats": 50000,
                        "product_type": product_type,
                        "title": f"{product_type} demo",
                        "description": "Protocol demo",
                        "proof_reference": reference,
                        "proof_type": proof_type,
                    },
                )
                self.assertEqual(create.status_code, 200, create.text)
                escrow = create.json()

                self.assertEqual(self.client.post(f"/api/v1/escrow/{escrow['payment_hash']}/pay").status_code, 200)

                if product_type == "COMMERCE":
                    ship = self.client.post(
                        "/api/v1/escrow/ship",
                        json={"payment_hash": escrow["payment_hash"], "tracking_number": reference},
                    )
                    self.assertEqual(ship.status_code, 200, ship.text)
                else:
                    fulfill = self.client.post(
                        f"/api/v1/escrow/{escrow['payment_hash']}/fulfill",
                        json={"reference": reference, "proof_type": proof_type},
                    )
                    self.assertEqual(fulfill.status_code, 200, fulfill.text)

                oracle = self.client.post(
                    "/api/v1/oracle/simulate-delivery",
                    json={"reference": reference, "status": "VERIFIED", "message": "Proof verified"},
                )
                self.assertEqual(oracle.status_code, 200, oracle.text)

                accept = self.client.post(f"/api/v1/escrow/{escrow['payment_hash']}/accept")
                self.assertEqual(accept.status_code, 200, accept.text)

                status = self.client.get(f"/api/v1/escrow/{escrow['payment_hash']}").json()["status"]
                self.assertEqual(status, "SETTLED")


if __name__ == "__main__":
    unittest.main()
