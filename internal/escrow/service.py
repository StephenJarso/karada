from __future__ import annotations

import time
from typing import Optional

from internal.escrow.repository import Escrow, EscrowNotFoundError, Repository
from internal.lightning.client import LightningClient
from pkg.crypto.random import generate_payment_hash, generate_preimage


class EscrowService:
    def __init__(self, repository: Repository, lightning_client: LightningClient, expiry: int) -> None:
        self.repository = repository
        self.lightning_client = lightning_client
        self.expiry = expiry

    def create_escrow(self, amount_sats: int, description: str) -> dict:
        preimage = generate_preimage()
        payment_hash = generate_payment_hash(preimage)

        invoice = self.lightning_client.create_hold_invoice(
            amount_sats=amount_sats,
            payment_hash=payment_hash,
            description=description,
            expiry=self.expiry,
        )

        escrow = Escrow(
            payment_hash=payment_hash,
            preimage=preimage,
            amount_sats=amount_sats,
            status="PENDING",
            description=description,
            expiry=self.expiry,
            created_at=int(time.time()),
            updated_at=int(time.time()),
        )
        self.repository.create(escrow)

        return {
            "payment_request": invoice["payment_request"],
            "payment_hash": payment_hash,
            "preimage": preimage,
            "amount_sats": amount_sats,
            "status": "PENDING",
            "expiry": self.expiry,
        }

    def ship_escrow(self, payment_hash: str, tracking_number: str) -> None:
        self.repository.update_tracking_number(payment_hash, tracking_number)

    def pay_escrow(self, payment_hash: str) -> None:
        self.repository.update_status(payment_hash, "HELD")

    def release_funds(self, tracking_number: str) -> None:
        escrow = self.repository.get_by_tracking_number(tracking_number)
        if escrow is None:
            raise EscrowNotFoundError("escrow not found")

        self.lightning_client.settle_invoice(escrow.preimage)
        self.repository.update_status(escrow.payment_hash, "SETTLED")

    def cancel_escrow(self, payment_hash: str) -> None:
        self.repository.update_status(payment_hash, "REFUNDED")
        self.lightning_client.cancel_invoice(payment_hash)

    def accept_escrow(self, payment_hash: str) -> None:
        escrow = self.repository.get_by_payment_hash(payment_hash)
        if escrow is None:
            raise EscrowNotFoundError("escrow not found")

        self.lightning_client.settle_invoice(escrow.preimage)
        self.repository.update_status(payment_hash, "SETTLED")

    def dispute_escrow(self, payment_hash: str) -> None:
        self.repository.update_status(payment_hash, "DISPUTED")

    def get_escrow(self, payment_hash: str) -> Optional[Escrow]:
        return self.repository.get_by_payment_hash(payment_hash)

    def list_escrows(self) -> list[Escrow]:
        return self.repository.list()
