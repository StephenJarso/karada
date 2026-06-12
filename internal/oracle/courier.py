from __future__ import annotations

from flask import Blueprint, jsonify, request

from internal.escrow.service import EscrowService


def courier_bp(service: EscrowService) -> Blueprint:
    bp = Blueprint("oracle", __name__, url_prefix="/api/v1/oracle")
    shipments = {}

    @bp.post("/simulate-delivery")
    def simulate_delivery():
        payload = request.get_json(silent=True) or {}
        tracking_number = payload.get("tracking_number", "")
        shipments[tracking_number] = {
            "tracking_number": tracking_number,
            "status": "DELIVERED",
        }
        service.release_funds(tracking_number)
        return jsonify({"status": "delivered", "message": "Funds released to merchant"})

    @bp.get("/shipment/<tracking_number>")
    def get_shipment(tracking_number: str):
        shipment = shipments.get(tracking_number)
        if shipment is None:
            return jsonify({"error": "shipment not found"}), 404
        return jsonify(shipment)

    return bp
