from __future__ import annotations

from typing import Dict


class LightningClient:
    def create_hold_invoice(self, amount_sats: int, payment_hash: str, description: str, expiry: int) -> Dict[str, object]:
        return {
            "payment_request": f"lnbc{amount_sats}m1p0...{payment_hash[:10]}",
            "payment_hash": payment_hash,
            "amount": amount_sats,
            "description": description,
            "expiry": expiry,
        }

    def settle_invoice(self, preimage: str) -> None:
        return None

    def cancel_invoice(self, payment_hash: str) -> None:
        return None
