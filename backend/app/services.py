"""
Service layer for Karada escrow business logic.

Karada's protocol is simple:
1. Generate a 32-byte preimage and HODL invoice payment_hash.
2. Buyer pays the BOLT11 invoice; funds are locked by HTLC/HODL.
3. Seller/school/savings organizer submits fulfillment proof.
4. Oracle verifies proof and opens a short inspection window.
5. Buyer accepts or disputes. Acceptance releases the preimage; disputes keep it hidden.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from .lnd_client import LNDClient
from .models import Escrow, EscrowStatus, ProductType
from .repository import EscrowRepository, ShipmentRepository


DEFAULT_INVOICE_EXPIRY_HOURS = 24
DEFAULT_INSPECTION_HOURS = 24


class EscrowService:
    """Service handles escrow business logic and state transitions."""

    def __init__(self, db: Session, lnd: Optional[LNDClient] = None):
        self.db = db
        self.escrow_repo = EscrowRepository(db)
        self.shipment_repo = ShipmentRepository(db)
        self.lnd = lnd

    def create_escrow(
        self,
        amount_sats: int,
        product_type: ProductType,
        title: str,
        description: str,
        counterparty_name: Optional[str] = None,
        terms: Optional[str] = None,
        tracking_number: Optional[str] = None,
        carrier: Optional[str] = None,
        proof_type: Optional[str] = None,
        proof_reference: Optional[str] = None,
        due_date: Optional[datetime] = None,
        inspection_hours: int = DEFAULT_INSPECTION_HOURS,
        invoice_expiry_hours: int = DEFAULT_INVOICE_EXPIRY_HOURS,
    ) -> dict:
        if amount_sats <= 0:
            raise ValueError("amount_sats must be a positive integer")
        if inspection_hours <= 0:
            raise ValueError("inspection_hours must be positive")
        if invoice_expiry_hours <= 0:
            raise ValueError("invoice_expiry_hours must be positive")
        if not self.lnd:
            raise ConnectionError("LND client not available")

        now = datetime.utcnow()
        result = self.lnd.add_hold_invoice(
            amount_sats,
            memo=self._memo(product_type, title, amount_sats),
            expiry_seconds=int(invoice_expiry_hours * 60 * 60),
        )

        escrow = Escrow(
            payment_hash=result["payment_hash_hex"],
            preimage=result["preimage_hex"],
            bolt11_invoice=result["payment_request"],
            product_type=product_type,
            title=title,
            description=description,
            counterparty_name=counterparty_name,
            terms=terms,
            amount_sats=amount_sats,
            tracking_number=tracking_number,
            carrier=carrier,
            proof_type=proof_type,
            proof_reference=proof_reference,
            status=EscrowStatus.PENDING,
            due_date=due_date,
            inspection_deadline=now + timedelta(hours=inspection_hours),
            invoice_expires_at=now + timedelta(hours=invoice_expiry_hours),
        )

        self.escrow_repo.create(escrow)
        self.shipment_repo.create(
            escrow=escrow,
            tracking_number=tracking_number or proof_reference or result["payment_hash_hex"][:12],
            carrier=carrier,
            proof_type=proof_type,
            proof_reference=proof_reference,
            status="INVOICE_CREATED",
            message=f"{product_type.value} escrow invoice created and awaiting Lightning payment.",
        )

        return {
            "payment_request": result["payment_request"],
            "payment_hash": result["payment_hash_hex"],
            "amount_sats": amount_sats,
            "status": EscrowStatus.PENDING.value,
        }

    def pay_escrow(self, payment_hash: str) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status == EscrowStatus.HELD:
            return True
        if escrow.status != EscrowStatus.PENDING:
            raise ValueError(f"Cannot pay escrow in {escrow.status.value} state")

        escrow.status = EscrowStatus.HELD
        escrow.held_at = datetime.utcnow()
        escrow.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(escrow)
        return True

    def submit_fulfillment(
        self,
        payment_hash: str,
        reference: str,
        proof_type: Optional[str] = None,
        carrier: Optional[str] = None,
        message: Optional[str] = None,
    ) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status != EscrowStatus.HELD:
            raise ValueError(f"Cannot submit fulfillment in {escrow.status.value} state")

        if escrow.product_type == ProductType.COMMERCE:
            self.escrow_repo.update_tracking_number(payment_hash, reference, carrier=carrier)
            self.shipment_repo.create(
                escrow=escrow,
                tracking_number=reference,
                carrier=carrier,
                proof_type=proof_type or "COURIER_TRACKING",
                proof_reference=reference,
                status="SUBMITTED",
                message=message or "Merchant submitted courier tracking proof.",
            )
            return True

        self.escrow_repo.update_proof_reference(payment_hash, proof_type, reference)
        self.shipment_repo.create(
            escrow=escrow,
            tracking_number=reference,
            carrier=carrier,
            proof_type=proof_type,
            proof_reference=reference,
            status="SUBMITTED",
            message=message or f"{escrow.product_type.value} fulfillment proof submitted.",
        )
        return True

    def ship_escrow(self, payment_hash: str, tracking_number: str, carrier: Optional[str] = None) -> bool:
        return self.submit_fulfillment(
            payment_hash,
            tracking_number,
            proof_type="COURIER_TRACKING",
            carrier=carrier,
            message="Merchant submitted courier tracking proof.",
        )

    def verify_oracle_proof(self, reference: str, status: str = "VERIFIED", message: Optional[str] = None) -> dict:
        escrow = self.escrow_repo.get_by_tracking_or_reference(reference)
        if not escrow:
            raise ValueError("Escrow not found")
        if escrow.status != EscrowStatus.IN_PROGRESS:
            raise ValueError(f"Cannot verify proof for escrow in {escrow.status.value} state")

        latest = self.shipment_repo.get_latest_for_escrow(escrow.id)
        if latest:
            latest.status = status
            latest.message = message or latest.message
            latest.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(latest)

        self.escrow_repo.update_delivered_at(escrow.payment_hash)
        verified_escrow = self.escrow_repo.get_by_payment_hash(escrow.payment_hash)
        return verified_escrow.to_dict() if verified_escrow else escrow.to_dict()

    def accept_delivery(self, payment_hash: str) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status != EscrowStatus.DELIVERED_INSPECTING:
            raise ValueError(f"Cannot accept escrow in {escrow.status.value} state")

        self._settle_escrow(escrow)
        escrow.status = EscrowStatus.SETTLED
        escrow.settled_at = datetime.utcnow()
        escrow.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(escrow)
        return True

    def dispute_delivery(self, payment_hash: str, reason: str) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status != EscrowStatus.DELIVERED_INSPECTING:
            raise ValueError(f"Cannot dispute escrow in {escrow.status.value} state")

        self.escrow_repo.update_dispute(payment_hash, reason)
        return True

    def settle_dispute(self, payment_hash: str, decision: str, resolution: str) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status != EscrowStatus.DISPUTED:
            raise ValueError(f"Cannot settle dispute for escrow in {escrow.status.value} state")

        decision = decision.upper()
        if decision not in {"SETTLE", "REFUND"}:
            raise ValueError("decision must be SETTLE or REFUND")

        if decision == "SETTLE":
            self._settle_escrow(escrow)
        else:
            self._cancel_escrow(escrow)

        self.escrow_repo.update_dispute_resolution(payment_hash, decision, resolution)
        return True

    def cancel_escrow(self, payment_hash: str) -> bool:
        escrow = self._get_escrow(payment_hash)
        if escrow.status in {EscrowStatus.SETTLED, EscrowStatus.CANCELLED, EscrowStatus.REFUNDED}:
            raise ValueError(f"Cannot cancel escrow in {escrow.status.value} state")

        self._cancel_escrow(escrow)
        escrow.status = EscrowStatus.CANCELLED
        escrow.cancelled_at = datetime.utcnow()
        escrow.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(escrow)
        return True

    def get_escrow(self, payment_hash: str) -> Optional[dict]:
        escrow = self.escrow_repo.get_by_payment_hash(payment_hash)
        return escrow.to_dict() if escrow else None

    def list_escrows(
        self,
        product_type: Optional[ProductType] = None,
        status: Optional[EscrowStatus] = None,
    ) -> list:
        return [e.to_dict() for e in self.escrow_repo.list_all(product_type=product_type, status=status)]

    def auto_release_due_inspections(self) -> int:
        now = datetime.utcnow()
        released = 0
        for escrow in self.escrow_repo.list_all(status=EscrowStatus.DELIVERED_INSPECTING):
            if escrow.inspection_deadline and escrow.inspection_deadline <= now:
                self.accept_delivery(escrow.payment_hash)
                released += 1
        return released

    def auto_cancel_expired_invoices(self) -> int:
        now = datetime.utcnow()
        cancelled = 0
        for escrow in self.escrow_repo.list_all(status=EscrowStatus.PENDING):
            if escrow.invoice_expires_at and escrow.invoice_expires_at <= now:
                self.cancel_escrow(escrow.payment_hash)
                cancelled += 1
        return cancelled

    def _settle_escrow(self, escrow: Escrow) -> None:
        if self.lnd:
            self.lnd.settle_hold_invoice(escrow.preimage)

    def _cancel_escrow(self, escrow: Escrow) -> None:
        if self.lnd:
            self.lnd.cancel_hold_invoice(escrow.payment_hash)

    def _get_escrow(self, payment_hash: str) -> Escrow:
        escrow = self.escrow_repo.get_by_payment_hash(payment_hash)
        if not escrow:
            raise ValueError("Escrow not found")
        return escrow

    @staticmethod
    def _memo(product_type: ProductType, title: str, amount_sats: int) -> str:
        return f"Karada {product_type.value}: {title} ({amount_sats} sats)"
