from __future__ import annotations

import json
import os
import subprocess
import time
from typing import Dict, Optional


class LightningClient:
    def __init__(
        self,
        lncli_path: Optional[str] = None,
        rpc_server: Optional[str] = None,
        network: Optional[str] = None,
        tls_cert_path: Optional[str] = None,
        macaroon_path: Optional[str] = None,
        lnd_dir: Optional[str] = None,
        timeout: int = 20,
        retries: int = 3,
        retry_delay: int = 2,
    ) -> None:
        self.lncli_path = lncli_path or os.getenv("LND_LNCLI_PATH", "lncli")
        self.rpc_server = rpc_server or os.getenv("LND_RPC_SERVER")
        self.network = network or os.getenv("LND_NETWORK") or "regtest"
        self.tls_cert_path = tls_cert_path or os.getenv("LND_TLS_CERT_PATH")
        self.macaroon_path = macaroon_path or os.getenv("LND_MACAROON_PATH")
        self.lnd_dir = lnd_dir or os.getenv("LND_LNDDIR") or os.getenv("LND_DIR")
        self.timeout = timeout
        self.retries = retries
        self.retry_delay = retry_delay

    def _build_command(self, *args: str) -> list[str]:
        command = [self.lncli_path]
        if self.rpc_server:
            command.extend(["--rpcserver", self.rpc_server])
        if self.network:
            command.extend(["--network", self.network])
        if self.tls_cert_path:
            command.extend(["--tlscertpath", self.tls_cert_path])
        if self.macaroon_path:
            command.extend(["--macaroonpath", self.macaroon_path])
        if self.lnd_dir:
            command.extend(["--lnddir", self.lnd_dir])
        return command + list(args)

    def _run(self, *args: str) -> Optional[Dict[str, object]]:
        command = self._build_command(*args)

        last_error = None
        for attempt in range(1, self.retries + 1):
            try:
                completed = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                )
            except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as error:
                last_error = error
                time.sleep(self.retry_delay)
                continue

            if completed.returncode == 0:
                output = completed.stdout.strip()
                if output:
                    try:
                        return json.loads(output)
                    except json.JSONDecodeError:
                        return None
                return None

            last_error = RuntimeError(completed.stderr.strip() or completed.stdout.strip())
            time.sleep(self.retry_delay)

        raise RuntimeError(f"LND command failed after {self.retries} attempts: {last_error}")

    def create_hold_invoice(self, amount_sats: int, payment_hash: str, description: str, expiry: int) -> dict:
        payload = self._run(
            "addholdinvoice",
            payment_hash,
            str(amount_sats),
            "--memo",
            description,
            "--amt",
            str(amount_sats),
            "--expiry",
            str(expiry),
        )

        if payload is None:
            raise RuntimeError("LND node is unreachable. Ensure lncli is installed and LND is running locally.")

        payment_request = payload.get("payment_request")
        if not isinstance(payment_request, str) or not payment_request:
            raise RuntimeError("LND node returned an invalid payment request.")

        return {
            "payment_request": payment_request,
            "payment_hash": payload.get("payment_hash", payment_hash),
            "amount": amount_sats,
            "description": description,
            "expiry": expiry,
        }

    def settle_invoice(self, preimage: str) -> None:
        payload = self._run("settleinvoice", preimage)
        if payload is None:
            raise RuntimeError("LND node failed to settle invoice.")
        return None

    def cancel_invoice(self, payment_hash: str) -> None:
        payload = self._run("cancelinvoice", payment_hash)
        if payload is None:
            raise RuntimeError("LND node failed to cancel invoice.")
        return None
