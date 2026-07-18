"""
FastAPI application for Karada's Python escrow protocol engine.

Karada exposes HODL-invoice escrow flows for three product families:
commerce, school fees, and savings. The protocol remains the same: lock funds
with a BOLT11 HODL invoice, verify fulfillment, then release or refund.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .lnd_client import LNDClient
from .models import EscrowStatus, ProductType, SessionLocal
from .schemas import (
    AcceptEscrowRequest,
    CancelEscrowRequest,
    CreateEscrowRequest,
    CreateEscrowResponse,
    DisputeEscrowRequest,
    FulfillEscrowRequest,
    OracleProofRequest,
    PayEscrowResponse,
    SettleDisputeRequest,
    ShipEscrowRequest,
)
from .services import EscrowService

def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_lnd():
    """LND client dependency. Defaults to mock mode when no LND credentials exist."""
    lnd_dir = os.getenv("LND_DIR")
    rest_host = os.getenv("LND_REST_HOST", "https://localhost:8082")
    return LNDClient(lnd_dir=lnd_dir, rest_host=rest_host)


app = FastAPI(
    title="Karada Escrow API",
    description="Trustless Lightning HODL invoice escrow for commerce, school fees, and savings",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/products")
def list_products():
    """Return supported product families and their proof model."""
    return [
        {
            "type": ProductType.COMMERCE.value,
            "label": "Commerce",
            "proof": "Courier tracking number or delivery signature",
            "settlement_rule": "Release after delivery and buyer inspection window.",
        },
        {
            "type": ProductType.SCHOOL_FEES.value,
            "label": "School Fees",
            "proof": "Admission letter, school invoice, or registrar confirmation",
            "settlement_rule": "Release after document verification and parent/student inspection window.",
        },
        {
            "type": ProductType.SAVINGS.value,
            "label": "Savings",
            "proof": "Savings goal, lock confirmation, or trusted custodian attestation",
            "settlement_rule": "Release after savings proof verification and dispute window.",
        },
    ]


@app.post("/api/v1/escrow", response_model=CreateEscrowResponse)
def create_escrow(request: CreateEscrowRequest, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    try:
        service = EscrowService(db, lnd)
        result = service.create_escrow(
            amount_sats=request.amount_sats,
            product_type=request.product_type,
            title=request.title,
            description=request.description,
            counterparty_name=request.counterparty_name,
            terms=request.terms,
            tracking_number=request.tracking_number,
            carrier=request.carrier,
            proof_type=request.proof_type,
            proof_reference=request.proof_reference,
            due_date=request.due_date,
            inspection_hours=request.inspection_hours,
            invoice_expiry_hours=request.invoice_expiry_hours,
        )
        return CreateEscrowResponse(**result)
    except ConnectionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/escrow")
def list_escrows(
    product_type: Optional[ProductType] = Query(default=None),
    status: Optional[EscrowStatus] = Query(default=None),
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    service = EscrowService(db, lnd)
    return service.list_escrows(product_type=product_type, status=status)


@app.post("/api/v1/escrow/ship")
def ship_escrow(request: ShipEscrowRequest, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    try:
        service = EscrowService(db, lnd)
        service.ship_escrow(request.payment_hash, request.tracking_number, carrier=request.carrier)
        return service.get_escrow(request.payment_hash) or {"status": "shipped"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/escrow/{payment_hash}")
def get_escrow(payment_hash: str, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    service = EscrowService(db, lnd)
    escrow = service.get_escrow(payment_hash)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrow


@app.post("/api/v1/escrow/{payment_hash}/pay", response_model=PayEscrowResponse)
def pay_escrow(payment_hash: str, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    try:
        service = EscrowService(db, lnd)
        service.pay_escrow(payment_hash)
        return {"status": "held"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/escrow/{payment_hash}/fulfill")
def fulfill_escrow(
    payment_hash: str,
    request: FulfillEscrowRequest,
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    try:
        service = EscrowService(db, lnd)
        service.submit_fulfillment(
            payment_hash,
            reference=request.reference,
            proof_type=request.proof_type,
            carrier=request.carrier,
            message=request.message,
        )
        escrow = service.get_escrow(payment_hash)
        return escrow or {"status": "fulfilled"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/oracle/delivery")
def oracle_delivery(request: OracleProofRequest, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    try:
        service = EscrowService(db, lnd)
        escrow = service.verify_oracle_proof(
            request.reference,
            status=request.status,
            message=request.message,
        )
        return escrow
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/oracle/simulate-delivery")
def simulate_delivery(request: OracleProofRequest, db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    return oracle_delivery(request, db, lnd)


@app.post("/api/v1/escrow/{payment_hash}/accept")
def accept_escrow(
    payment_hash: str,
    request: Optional[AcceptEscrowRequest] = None,
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    try:
        service = EscrowService(db, lnd)
        service.accept_delivery(payment_hash)
        return {"status": "settled"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/escrow/{payment_hash}/dispute")
def dispute_escrow(
    payment_hash: str,
    request: DisputeEscrowRequest,
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    try:
        service = EscrowService(db, lnd)
        service.dispute_delivery(payment_hash, request.reason)
        return {"status": "disputed"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/escrow/{payment_hash}/settle-dispute")
def settle_dispute(
    payment_hash: str,
    request: SettleDisputeRequest,
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    try:
        service = EscrowService(db, lnd)
        service.settle_dispute(payment_hash, request.decision, request.resolution)
        return {"status": "dispute_settled"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/escrow/{payment_hash}/cancel")
def cancel_escrow(
    payment_hash: str,
    request: Optional[CancelEscrowRequest] = None,
    db: Session = Depends(get_db),
    lnd: LNDClient = Depends(get_lnd),
):
    try:
        service = EscrowService(db, lnd)
        service.cancel_escrow(payment_hash)
        return {"status": "cancelled"}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/workers/auto-release")
def auto_release(db: Session = Depends(get_db), lnd: LNDClient = Depends(get_lnd)):
    service = EscrowService(db, lnd)
    released = service.auto_release_due_inspections()
    cancelled = service.auto_cancel_expired_invoices()
    return {"released": released, "cancelled": cancelled}


@app.get("/health")
def health_check():
    return {"status": "ok", "backend": "python", "version": "1.0.0"}


@app.get("/")
def root():
    return {
        "name": "Karada",
        "status": "running",
        "backend": "python",
        "version": "1.0.0",
        "products": [p.value for p in ProductType],
    }


