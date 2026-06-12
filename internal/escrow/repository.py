from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from internal.escrow.migrations import MigrationRunner


class EscrowNotFoundError(Exception):
    pass


@dataclass
class Escrow:
    payment_hash: str
    preimage: str
    amount_sats: int
    status: str = "PENDING"
    tracking_number: Optional[str] = None
    description: str = ""
    expiry: int = 0
    created_at: int = 0
    updated_at: int = 0


class Repository:
    def __init__(self, db_path: str = "karada.sqlite3") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._run_migrations()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _run_migrations(self) -> None:
        MigrationRunner(str(self.db_path)).run()

    def create(self, escrow: Escrow) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR REPLACE INTO escrows (
                    payment_hash, preimage, amount_sats, status, tracking_number,
                    description, expiry, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    escrow.payment_hash,
                    escrow.preimage,
                    escrow.amount_sats,
                    escrow.status,
                    escrow.tracking_number,
                    escrow.description,
                    escrow.expiry,
                    escrow.created_at,
                    escrow.updated_at,
                ),
            )
            connection.commit()

    def get_by_payment_hash(self, payment_hash: str) -> Optional[Escrow]:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM escrows WHERE payment_hash = ?",
                (payment_hash,),
            ).fetchone()

        if row is None:
            return None
        return self._row_to_escrow(row)

    def get_by_tracking_number(self, tracking_number: str) -> Optional[Escrow]:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM escrows WHERE tracking_number = ?",
                (tracking_number,),
            ).fetchone()

        if row is None:
            return None
        return self._row_to_escrow(row)

    def update_status(self, payment_hash: str, status: str) -> None:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow is None:
            raise EscrowNotFoundError("escrow not found")

        with self._connect() as connection:
            connection.execute(
                "UPDATE escrows SET status = ?, updated_at = ? WHERE payment_hash = ?",
                (status, self._timestamp(), payment_hash),
            )
            connection.commit()

    def update_tracking_number(self, payment_hash: str, tracking_number: str) -> None:
        escrow = self.get_by_payment_hash(payment_hash)
        if escrow is None:
            raise EscrowNotFoundError("escrow not found")

        with self._connect() as connection:
            connection.execute(
                "UPDATE escrows SET tracking_number = ?, status = ?, updated_at = ? WHERE payment_hash = ?",
                (tracking_number, "SHIPPED", self._timestamp(), payment_hash),
            )
            connection.commit()

    def list(self) -> List[Escrow]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM escrows ORDER BY created_at").fetchall()

        return [self._row_to_escrow(row) for row in rows]

    @staticmethod
    def _row_to_escrow(row: sqlite3.Row) -> Escrow:
        return Escrow(
            payment_hash=row["payment_hash"],
            preimage=row["preimage"],
            amount_sats=row["amount_sats"],
            status=row["status"],
            tracking_number=row["tracking_number"],
            description=row["description"],
            expiry=row["expiry"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _timestamp() -> int:
        import time

        return int(time.time())
