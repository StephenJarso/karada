from flask import Flask, jsonify

from internal.escrow.handler import escrow_bp
from internal.escrow.repository import Repository
from internal.escrow.service import EscrowService
from internal.lightning.client import LightningClient
from internal.oracle.courier import courier_bp


def create_app(lightning_client=None) -> Flask:
    app = Flask(__name__)

    lightning_client = lightning_client or LightningClient()
    if lightning_client.rpc_server is None:
        raise RuntimeError(
            "LND_RPC_SERVER is not set. The merchant requires a real local lnd node. "
            "Start one with: docker compose -f docker-compose.local-lnd.yml up -d "
            "and export LND_RPC_SERVER, LND_TLS_CERT_PATH, LND_MACAROON_PATH."
        )

    repository = Repository()
    escrow_service = EscrowService(repository, lightning_client, expiry=432 * 60 * 10)

    app.register_blueprint(escrow_bp(escrow_service))
    app.register_blueprint(courier_bp(escrow_service))

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/")
    def index():
        return jsonify({"name": "Karada", "status": "running", "version": "0.1.0"})

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=8080, debug=True)
