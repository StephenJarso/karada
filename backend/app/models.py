"""
Database models for Karada's Python escrow protocol engine.

Karada is intentionally product-agnostic: commerce, school fees, and savings
all share the same HTLC/HODL invoice escrow state machine. Product-specific
fields describe what proof Karada must observe before releasing the preimage.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import BigInteger, Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, create_engine
from .time import utcnow
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

import os


Base = declarative_base()


class ProductType(str, Enum):
    """Supported Karada product families."""

    COMMERCE = "COMMERCE"
    SCHOOL_FEES = "SCHOOL_FEES"
    SAVINGS = "SAVINGS"


class EscrowStatus(str, Enum):
    """Escrow state machine states."""

    PENDING = "PENDING"  # HODL invoice created; waiting for Lightning commitment
    HELD = "HELD"  # HTLC/HODL payment is locked in the network
    IN_PROGRESS = "IN_PROGRESS"  # merchant/school/savings proof has been submitted
    DELIVERED_INSPECTING = "DELIVERED_INSPECTING"  # oracle verified proof; buyer inspection window is active
    DISPUTED = "DISPUTED"  # buyer raised dispute; preimage remains hidden
    SETTLED = "SETTLED"  # preimage released; merchant/school/savings recipient paid
    CANCELLED = "CANCELLED"  # invoice cancelled; buyer refund path is active
    REFUNDED = "REFUNDED"  # dispute resolved or expiry triggered a refund


class Escrow(Base):
    """
    Escrow transaction model.

    The preimage is stored server-side only. The public API never returns it.
    The payment_hash and BOLT11 invoice are the audit trail exposed to users.
    """

    __tablename__ = "escrows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_hash = Column(String(64), unique=True, nullable=False, index=True)
    preimage = Column(String(64), unique=True, nullable=False)
    bolt11_invoice = Column(Text, nullable=False)

    product_type = Column(SQLEnum(ProductType), default=ProductType.COMMERCE, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    counterparty_name = Column(String(255), nullable=True)
    terms = Column(Text, nullable=True)

    amount_sats = Column(BigInteger, nullable=False)
    tracking_number = Column(String(100), nullable=True, index=True)
    carrier = Column(String(100), nullable=True)
    proof_type = Column(String(100), nullable=True)
    proof_reference = Column(String(255), nullable=True, index=True)

    status = Column(SQLEnum(EscrowStatus), default=EscrowStatus.PENDING, nullable=False, index=True)
    dispute_reason = Column(Text, nullable=True)
    dispute_resolution = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    held_at = Column(DateTime, nullable=True)
    in_progress_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    settled_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    due_date = Column(DateTime, nullable=True)
    inspection_deadline = Column(DateTime, nullable=True)
    invoice_expires_at = Column(DateTime, nullable=True)

    shipments = relationship("Shipment", back_populates="escrow", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Convert to API-safe dictionary. The preimage is intentionally excluded."""
        return {
            "id": self.id,
            "payment_hash": self.payment_hash,
            "bolt11_invoice": self.bolt11_invoice,
            "product_type": self.product_type.value,
            "title": self.title,
            "description": self.description,
            "counterparty_name": self.counterparty_name,
            "terms": self.terms,
            "amount_sats": self.amount_sats,
            "tracking_number": self.tracking_number,
            "carrier": self.carrier,
            "proof_type": self.proof_type,
            "proof_reference": self.proof_reference,
            "status": self.status.value,
            "dispute_reason": self.dispute_reason,
            "dispute_resolution": self.dispute_resolution,
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
            "held_at": _iso(self.held_at),
            "in_progress_at": _iso(self.in_progress_at),
            "delivered_at": _iso(self.delivered_at),
            "settled_at": _iso(self.settled_at),
            "cancelled_at": _iso(self.cancelled_at),
            "due_date": _iso(self.due_date),
            "inspection_deadline": _iso(self.inspection_deadline),
            "invoice_expires_at": _iso(self.invoice_expires_at),
        }


class Shipment(Base):
    """
    Shipment or proof event ledger.

    For commerce this represents courier events. For school fees and savings it
    represents oracle/verification events such as admission confirmation or
    savings lock confirmation.
    """

    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    escrow_id = Column(Integer, ForeignKey("escrows.id"), nullable=False, index=True)
    tracking_number = Column(String(100), nullable=False, index=True)
    carrier = Column(String(100), nullable=True)
    proof_type = Column(String(100), nullable=True)
    proof_reference = Column(String(255), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)
    message = Column(Text, nullable=True)
    source = Column(String(50), default="KARADA", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    escrow = relationship("Escrow", back_populates="shipments")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "escrow_id": self.escrow_id,
            "tracking_number": self.tracking_number,
            "carrier": self.carrier,
            "proof_type": self.proof_type,
            "proof_reference": self.proof_reference,
            "status": self.status,
            "message": self.message,
            "source": self.source,
            "created_at": _iso(self.created_at),
            "updated_at": _iso(self.updated_at),
        }


# ===========================================
# DATABASE SINGLETON SETUP
# ===========================================
_database_url = os.getenv("DATABASE_URL", "sqlite:///./karada.db")
engine = create_engine(
    _database_url,
    connect_args={"check_same_thread": False} if _database_url.startswith("sqlite") else {},
)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_engine(database_url: Optional[str] = None):
    """Create database engine (for backward compatibility, returns singleton)."""
    return engine


def get_session(engine_obj=None):
    """Create database session (for backward compatibility, returns singleton)."""
    return SessionLocal


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None
