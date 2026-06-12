from __future__ import annotations

from flask import Blueprint, jsonify, request

from internal.escrow.repository import EscrowNotFoundError
from internal.escrow.service import EscrowService


def escrow_bp(service: EscrowService) -> Blueprint:
    bp = Blueprint("escrow", __name__, url_prefix="/api/v1/escrow")

    @bp.post("")
    def create_escrow():
        payload = request.get_json(silent=True) or {}
        amount_sats = int(payload.get("amount_sats", 0))
        description = payload.get("description", "")
        return jsonify(service.create_escrow(amount_sats, description))

    @bp.post("/ship")
    def ship_escrow():
        payload = request.get_json(silent=True) or {}
        payment_hash = payload.get("payment_hash", "")
        tracking_number = payload.get("tracking_number", "")
        service.ship_escrow(payment_hash, tracking_number)
        return jsonify({"status": "shipped"})

    @bp.post("/cancel")
    def cancel_escrow():
        payload = request.get_json(silent=True) or {}
        payment_hash = payload.get("payment_hash", "")
        service.cancel_escrow(payment_hash)
        return jsonify({"status": "cancelled"})

    @bp.post("/<payment_hash>/pay")
    def pay_escrow(payment_hash: str):
        try:
            service.pay_escrow(payment_hash)
        except EscrowNotFoundError:
            return jsonify({"error": "escrow not found"}), 404
        return jsonify({"status": "held"})

    @bp.post("/<payment_hash>/accept")
    def accept_escrow(payment_hash: str):
        try:
            service.accept_escrow(payment_hash)
        except EscrowNotFoundError:
            return jsonify({"error": "escrow not found"}), 404
        return jsonify({"status": "settled"})

    @bp.post("/<payment_hash>/dispute")
    def dispute_escrow(payment_hash: str):
        try:
            service.dispute_escrow(payment_hash)
        except EscrowNotFoundError:
            return jsonify({"error": "escrow not found"}), 404
        return jsonify({"status": "disputed"})

    @bp.get("/<payment_hash>")
    def get_escrow(payment_hash: str):
        escrow = service.get_escrow(payment_hash)
        if escrow is None:
            return jsonify({"error": "escrow not found"}), 404
        return jsonify(
            {
                "payment_hash": escrow.payment_hash,
                "preimage": escrow.preimage,
                "amount_sats": escrow.amount_sats,
                "status": escrow.status,
                "tracking_number": escrow.tracking_number,
                "description": escrow.description,
            }
        )

    @bp.get("")
    def list_escrows():
        escrows = service.list_escrows()
        return jsonify([escrow.__dict__ for escrow in escrows])

    return bp
