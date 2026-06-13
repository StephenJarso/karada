"""
Repository layer for Karada escrow and proof-event operations.
"""

from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from .models import Escrow, EscrowStatus, ProductType, Shipment
from .time import utcnow


class EscrowRepository:
    """Repository for escrow operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, escrow: Escrow) -> Escrow:
        self.db.add(escrow)
        self.db.commit()
        self.db.refresh(escrow)
        return escrow

    def get_by_payment_hash(self, payment_hash: str) -> Optional[Escrow]:
        return self.db.query(Escrow).filter(Escrow.payment_hash == payment_hash).first()

    def get_by_tracking_number(self, tracking_number: str) -> Optional[Escrow]:
        return self.db.query(Escrow).filter(Escrow.tracking_number == tracking_number).first()

    def get_by_proof_reference(self, proof_reference: str) -> Optional[Escrow]:
        return self.db.query(Escrow).filter(Escrow.proof_reference == proof_reference).first()

    def get_by_tracking_or_reference(self, reference: str) -> Optional[Escrow]:
        return (
            self.db.query(Escrow)
            .filter((Escrow.tracking_number == reference) | (Escrow.proof_reference == reference))
            .first()
        )

    def update_status(self, payment_hash: str, status: EscrowStatus) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.status = status
            escrow.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def update_tracking_number(self, payment_hash: str, tracking_number: str, carrier: Optional[str] = None) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.tracking_number = tracking_number
            escrow.carrier = carrier
            escrow.status = EscrowStatus.IN_PROGRESS
            escrow.in_progress_at = utcnow()
            escrow.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def update_proof_reference(
        self,
        payment_hash: str,
        proof_type: Optional[str],
        proof_reference: str,
    ) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.proof_type = proof_type
            escrow.proof_reference = proof_reference
            escrow.status = EscrowStatus.IN_PROGRESS
            escrow.in_progress_at = utcnow()
            escrow.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def update_delivered_at(self, payment_hash: str) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.delivered_at = utcnow()
            escrow.status = EscrowStatus.DELIVERED_INSPECTING
            escrow.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def update_dispute(self, payment_hash: str, reason: str) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.dispute_reason = reason
            escrow.status = EscrowStatus.DISPUTED
            escrow.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def update_dispute_resolution(self, payment_hash: str, decision: str, resolution: str) -> Optional[Escrow]:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            escrow.dispute_resolution = resolution
            escrow.status = EscrowStatus.SETTLED if decision.upper() == "SETTLE" else EscrowStatus.REFUNDED
            escrow.updated_at = utcnow()
            if escrow.status == EscrowStatus.SETTLED:
                escrow.settled_at = utcnow()
            else:
                escrow.cancelled_at = utcnow()
            self.db.commit()
            self.db.refresh(escrow)
        return escrow

    def list_all(
        self,
        product_type: Optional[ProductType] = None,
        status: Optional[EscrowStatus] = None,
    ) -> List[Escrow]:
        query = self.db.query(Escrow)
        if product_type:
            query = query.filter(Escrow.product_type == product_type)
        if status:
            query = query.filter(Escrow.status == status)
        return query.order_by(Escrow.created_at.desc()).all()

    def list_active(self) -> List[Escrow]:
        return (
            self.db.query(Escrow)
            .filter(Escrow.status.in_([EscrowStatus.PENDING, EscrowStatus.HELD, EscrowStatus.IN_PROGRESS]))
            .order_by(Escrow.created_at.desc())
            .all()
        )

    def delete(self, payment_hash: str) -> bool:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow:
            self.db.delete(escrow)
            self.db.commit()
            return True
        return False


class ShipmentRepository:
    """Repository for shipment/proof event operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        escrow: Escrow,
        tracking_number: str,
        carrier: Optional[str] = None,
        proof_type: Optional[str] = None,
        proof_reference: Optional[str] = None,
        status: str = "PENDING",
        message: Optional[str] = None,
        source: str = "KARADA",
    ) -> Shipment:
        shipment = Shipment(
            escrow_id=escrow.id,
            tracking_number=tracking_number,
            carrier=carrier,
            proof_type=proof_type,
            proof_reference=proof_reference,
            status=status,
            message=message,
            source=source,
        )
        self.db.add(shipment)
        self.db.commit()
        self.db.refresh(shipment)
        return shipment

    def get(self, tracking_number: str) -> Optional[Shipment]:
        return self.db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()

    def get_latest_for_escrow(self, escrow_id: int) -> Optional[Shipment]:
        return (
            self.db.query(Shipment)
            .filter(Shipment.escrow_id == escrow_id)
            .order_by(Shipment.created_at.desc())
            .first()
        )

    def update_status(self, tracking_number: str, status: str, message: Optional[str] = None) -> Optional[Shipment]:
        shipment = self.get(tracking_number)
        if shipment:
            shipment.status = status
            shipment.message = message or shipment.message
            shipment.updated_at = utcnow()
            self.db.commit()
            self.db.refresh(shipment)
        return shipment

    def list_all(self) -> List[Shipment]:
        return self.db.query(Shipment).order_by(Shipment.created_at.desc()).all()

    def list_by_status(self, status: str) -> List[Shipment]:
        return self.db.query(Shipment).filter(Shipment.status == status).order_by(Shipment.created_at.desc()).all()
