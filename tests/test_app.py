import importlib

from internal.escrow.repository import Escrow, Repository
from internal.lightning.client import LightningClient


class FakeLightningClient(LightningClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **{"rpc_server": "localhost:10009", **kwargs})

    def create_hold_invoice(self, amount_sats, payment_hash, description, expiry):
        return {
            "payment_request": f"lnbc{amount_sats}m1p0...{payment_hash[:10]}",
            "payment_hash": payment_hash,
            "amount": amount_sats,
            "description": description,
            "expiry": expiry,
        }

    def settle_invoice(self, preimage):
        return None

    def cancel_invoice(self, payment_hash):
        return None


def test_app_factory_creates_flask_app():
    app_module = importlib.import_module("app.main")
    app = app_module.create_app(lightning_client=FakeLightningClient())

    client = app.test_client()
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_escrow_accept_flow_updates_status():
    app_module = importlib.import_module("app.main")
    app = app_module.create_app(lightning_client=FakeLightningClient())

    client = app.test_client()
    create_response = client.post(
        "/api/v1/escrow",
        json={"amount_sats": 100, "description": "sample item"},
    )
    payload = create_response.get_json()

    payment_hash = payload["payment_hash"]

    pay_response = client.post(f"/api/v1/escrow/{payment_hash}/pay")
    assert pay_response.status_code == 200

    accept_response = client.post(f"/api/v1/escrow/{payment_hash}/accept")
    assert accept_response.status_code == 200

    status_response = client.get(f"/api/v1/escrow/{payment_hash}")
    assert status_response.status_code == 200
    assert status_response.get_json()["status"] == "SETTLED"


def test_repository_persists_data_across_instances(tmp_path):
    db_path = tmp_path / "escrows.sqlite3"

    first_repo = Repository(str(db_path))
    first_repo.create(
        Escrow(payment_hash="hash-123", preimage="preimage-123", amount_sats=555)
    )

    second_repo = Repository(str(db_path))
    escrow = second_repo.get_by_payment_hash("hash-123")

    assert escrow is not None
    assert escrow.amount_sats == 555
