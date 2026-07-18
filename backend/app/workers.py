"""
Background workers for Karada escrow system.

- InvoicePoller detects when a BOLT11 HODL invoice is paid/accepted and moves
  the escrow from PENDING to HELD.
- OracleMonitor verifies submitted fulfillment proofs and opens the inspection
  window. In production this is replaced or supplemented by courier, school, or
  savings oracle webhooks.
"""

from __future__ import annotations

import asyncio
import base64
from typing import Optional

from .lnd_client import LNDClient
from .models import EscrowStatus
from .services import EscrowService


def hex_to_base64(hex_str: str) -> str:
    """Convert hex payment hash to URL-safe base64 for LND API."""
    return base64.b64encode(bytes.fromhex(hex_str)).decode("utf-8")


class InvoicePoller:
    """Poll LND for invoice state changes."""

    def __init__(self, service: EscrowService, poll_interval: int = 10):
        self.service = service
        self.poll_interval = poll_interval
        self.running = False

    async def start(self):
        self.running = True
        while self.running:
            try:
                await self.poll_invoices()
            except Exception as exc:
                print(f"Invoice poller error: {exc}")
            await asyncio.sleep(self.poll_interval)

    async def stop(self):
        self.running = False

    async def poll_invoices(self):
        if not self.service.lnd:
            return

        pending_escrows = [
            e for e in self.service.list_escrows(status=EscrowStatus.PENDING)
        ]

        for escrow in pending_escrows:
            try:
                payment_hash_b64 = hex_to_base64(escrow["payment_hash"])
                invoice = self.service.lnd.lookup_invoice(payment_hash_b64)
                state = str(invoice.get("state", "")).upper()
                if state in {"ACCEPTED", "HELD"} or invoice.get("settled") is True:
                    self.service.pay_escrow(escrow["payment_hash"])
                    print(f"Invoice {escrow['payment_hash'][:16]}... is now HELD")
            except Exception as exc:
                print(f"Error checking invoice {escrow['payment_hash'][:16]}...: {exc}")


class OracleMonitor:
    """Poll local proof events and transition verified proofs to inspection."""

    def __init__(self, service: EscrowService, poll_interval: int = 10):
        self.service = service
        self.poll_interval = poll_interval
        self.running = False

    async def start(self):
        self.running = True
        while self.running:
            try:
                await self.poll_proofs()
                self.service.auto_release_due_inspections()
                self.service.auto_cancel_expired_invoices()
            except Exception as exc:
                print(f"Oracle monitor error: {exc}")
            await asyncio.sleep(self.poll_interval)

    async def stop(self):
        self.running = False

    async def poll_proofs(self):
        for shipment in self.service.shipment_repo.list_by_status("VERIFIED"):
            reference = shipment.proof_reference or shipment.tracking_number
            if not reference:
                continue
            try:
                escrow = self.service.escrow_repo.get_by_tracking_or_reference(reference)
                if not escrow:
                    continue
                if escrow.status == EscrowStatus.IN_PROGRESS:
                    self.service.verify_oracle_proof(reference, status="VERIFIED", message=shipment.message)
                    print(f"Proof {reference} verified; escrow opened for inspection")
            except Exception as exc:
                print(f"Error checking proof {reference}: {exc}")


async def run_workers(service: EscrowService):
    """Run all background workers concurrently."""
    poller = InvoicePoller(service)
    oracle = OracleMonitor(service)
    await asyncio.gather(poller.start(), oracle.start())
