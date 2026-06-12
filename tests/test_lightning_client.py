from __future__ import annotations

from internal.lightning.client import LightningClient


def test_lightning_client_uses_lncli_when_available(tmp_path):
    script_path = tmp_path / "fake-lncli"
    script_path.write_text(
        "#!/bin/sh\n"
        "printf '{\"payment_request\":\"lnbc100m1p0\",\"payment_hash\":\"%s\"}\n' \"$4\"\n"
    )
    script_path.chmod(0o755)

    client = LightningClient(lncli_path=str(script_path), network="regtest")
    invoice = client.create_hold_invoice(
        amount_sats=100,
        payment_hash="a" * 64,
        description="demo item",
        expiry=600,
    )

    assert invoice["payment_request"].startswith("lnbc")
    assert invoice["payment_hash"] == "a" * 64
    assert invoice["amount"] == 100
    assert invoice["description"] == "demo item"
