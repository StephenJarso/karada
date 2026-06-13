#!/usr/bin/env python3
"""
LND REST API client for Karada HODL invoices.

The client supports both real LND REST integration and a deterministic local
mock mode. Mock mode is used for development, demos, and CI so the product can
run without a Polar/LND node while preserving the same API shape.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any, Dict, Optional

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def auto_detect(node_name: str = "bob") -> tuple[Optional[str], Optional[str]]:
    """Auto-detect Polar LND node configuration."""
    polar_paths = [
        f"/home/sjarso/.polar/nodes/{node_name}",
        f"/home/sjarso/.polar/networks/default/{node_name}",
        os.path.expanduser(f"~/polar/nodes/{node_name}"),
    ]

    for path in polar_paths:
        macaroon_name = os.getenv("LND_MACAROON", "admin.macaroon")
        macaroon_path = os.path.join(path, "data", "chain", "bitcoin", "regtest", macaroon_name)
        if os.path.exists(macaroon_path):
            return path, os.getenv("LND_REST_HOST", "https://localhost:8082")

    return None, None


class LNDClient:
    """Client for LND REST HODL invoice operations."""

    def __init__(
        self,
        lnd_dir: Optional[str] = None,
        rest_host: Optional[str] = None,
        verify_tls: Optional[bool] = None,
        macaroon_name: Optional[str] = None,
        mock: Optional[bool] = None,
    ):
        detected_dir, detected_host = auto_detect("bob")
        self.lnd_dir = lnd_dir or detected_dir or os.getenv("LND_DIR") or os.path.expanduser("~/bootcamp-code/day3/bob")
        self.rest_host = rest_host or detected_host or os.getenv("LND_REST_HOST") or "https://localhost:8082"

        if verify_tls is None:
            verify_tls = os.getenv("LND_VERIFY_TLS", "true").lower() != "false"
        self.verify_tls = verify_tls

        self.macaroon_name = macaroon_name or os.getenv("LND_MACAROON", "admin.macaroon")
        self.macaroon: Optional[str] = None

        macaroon_path = os.path.join(
            self.lnd_dir, "data", "chain", "bitcoin", "regtest", self.macaroon_name
        )
        try:
            with open(macaroon_path, "rb") as f:
                self.macaroon = f.read().hex()
        except FileNotFoundError:
            pass

        self.tls_cert = os.path.join(self.lnd_dir, "tls.cert")

        if mock is None:
            mock_setting = os.getenv("LND_MOCK", "auto").lower()
            mock = mock_setting in {"1", "true", "yes", "auto"} and self.macaroon is None
        self.mock = bool(mock)

    def _request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an authenticated request to LND REST API."""
        if self.mock:
            return self._mock_request(method, endpoint, data)

        if not self.macaroon:
            raise ConnectionError(
                f"LND not found at {self.lnd_dir}. "
                "Set LND_DIR/LND_MACAROON_PATH or run with LND_MOCK=true for demo mode."
            )

        url = f"{self.rest_host}{endpoint}"
        headers = {"Grpc-Metadata-macaroon": self.macaroon}

        if method == "GET":
            resp = requests.get(url, headers=headers, verify=self.verify_tls, timeout=10)
        elif method == "POST":
            headers["Content-Type"] = "application/json"
            resp = requests.post(url, headers=headers, data=json.dumps(data), verify=self.verify_tls, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, verify=self.verify_tls, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")

        resp.raise_for_status()
        return resp.json()

    def _mock_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Return deterministic mock responses for local development."""
        if endpoint == "/v2/invoices/hodl":
            preimage = os.urandom(32)
            payment_hash = hashlib.sha256(preimage).digest()
            payment_hash_hex = payment_hash.hex()
            payment_request = f"lnbc{data.get('value', '0')}m1{payment_hash_hex[:40]}mockkarada"
            return {
                "payment_request": payment_request,
                "r_hash": base64.b64encode(payment_hash).decode("utf-8"),
                "state": "ACCEPTED",
            }

        if endpoint.startswith("/v1/invoice/"):
            return {"state": "ACCEPTED", "settled": False}

        if endpoint == "/v2/invoices/hodl/settle":
            return {"settled": True}

        if endpoint == "/v2/invoices/hodl/cancel":
            return {"cancelled": True}

        if endpoint == "/v1/getinfo":
            return {"alias": "karada-mock", "identity_pubkey": "mock", "synced_to_chain": True}

        return {"ok": True}

    def get_info(self) -> Dict[str, Any]:
        """Get node information."""
        return self._request("GET", "/v1/getinfo")

    def channel_balance(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/balance/channels")

    def wallet_balance(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/balance/blockchain")

    def add_invoice(self, amount: int, memo: str = "") -> Dict[str, Any]:
        data = {"value": str(amount), "memo": memo}
        return self._request("POST", "/v1/invoices", data)

    def lookup_invoice(self, r_hash_str: str) -> Dict[str, Any]:
        return self._request("GET", f"/v1/invoice/{r_hash_str}")

    def list_invoices(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/invoices")

    def add_hold_invoice(
        self,
        amount: int,
        memo: str = "",
        expiry_seconds: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Create a HODL invoice from a generated 32-byte preimage."""
        preimage = os.urandom(32)
        payment_hash = hashlib.sha256(preimage).digest()
        hash_b64 = base64.b64encode(payment_hash).decode("utf-8")

        data: Dict[str, Any] = {
            "value": str(amount),
            "memo": memo,
            "hash": hash_b64,
        }
        if expiry_seconds:
            data["expiry"] = str(expiry_seconds)

        resp = self._request("POST", "/v2/invoices/hodl", data)

        return {
            "preimage_hex": preimage.hex(),
            "payment_hash_hex": payment_hash.hex(),
            "payment_request": resp.get("payment_request"),
        }

    def settle_hold_invoice(self, preimage_hex: str) -> Dict[str, Any]:
        """Release funds by revealing the secret preimage."""
        preimage_bytes = bytes.fromhex(preimage_hex)
        preimage_b64 = base64.b64encode(preimage_bytes).decode("utf-8")
        return self._request("POST", "/v2/invoices/hodl/settle", {"preimage": preimage_b64})

    def cancel_hold_invoice(self, payment_hash_hex: str) -> Dict[str, Any]:
        """Cancel a HODL invoice and unlock the refund path."""
        hash_bytes = bytes.fromhex(payment_hash_hex)
        hash_b64 = base64.b64encode(hash_bytes).decode("utf-8")
        return self._request("POST", "/v2/invoices/hodl/cancel", {"payment_hash": hash_b64})

    def list_payments(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/payments")

    def decode_pay_req(self, pay_req: str) -> Dict[str, Any]:
        return self._request("GET", f"/v1/payreq/{pay_req}")

    def list_channels(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/channels")

    def list_peers(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/peers")


if __name__ == "__main__":
    print("=== LND Client Test ===")
    lnd = LNDClient()
    print(f"Mock mode: {lnd.mock}")
    print(f"LND dir: {lnd.lnd_dir}")
    print(f"REST host: {lnd.rest_host}")
    try:
        print(lnd.get_info())
    except Exception as exc:
        print(f"Error: {exc}")
