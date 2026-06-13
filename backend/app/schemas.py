from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .models import ProductType


class CreateEscrowRequest(BaseModel):
    amount_sats: int = Field(gt=0, description="Amount in satoshis")
    product_type: ProductType = ProductType.COMMERCE
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    counterparty_name: Optional[str] = None
    terms: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    proof_type: Optional[str] = None
    proof_reference: Optional[str] = None
    due_date: Optional[datetime] = None
    inspection_hours: int = Field(default=24, gt=0)
    invoice_expiry_hours: int = Field(default=24, gt=0)


class CreateEscrowResponse(BaseModel):
    payment_request: str
    payment_hash: str
    amount_sats: int
    status: str


class PayEscrowResponse(BaseModel):
    status: str


class FulfillEscrowRequest(BaseModel):
    reference: str = Field(min_length=1)
    proof_type: Optional[str] = None
    carrier: Optional[str] = None
    message: Optional[str] = None


class ShipEscrowRequest(BaseModel):
    payment_hash: str = Field(min_length=1)
    tracking_number: str = Field(min_length=1)
    carrier: Optional[str] = None


class OracleProofRequest(BaseModel):
    reference: str = Field(min_length=1)
    status: str = "VERIFIED"
    message: Optional[str] = None


class AcceptEscrowRequest(BaseModel):
    confirmation: Optional[str] = None


class DisputeEscrowRequest(BaseModel):
    reason: str = Field(min_length=1)


class SettleDisputeRequest(BaseModel):
    decision: str
    resolution: str = Field(min_length=1)


class CancelEscrowRequest(BaseModel):
    reason: Optional[str] = None
