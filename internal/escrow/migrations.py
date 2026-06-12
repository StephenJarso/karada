from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import List


class MigrationRunner:
    def __init__(self, db_path: str = "karada.sqlite3") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def run(self) -> None:
        with sqlite3.connect(self.db_path) as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)")
            for migration in self._migrations():
                if self._applied(connection, migration["name"]):
                    continue
                connection.execute(migration["sql"])
                connection.execute(
                    "INSERT INTO schema_migrations (name) VALUES (?)",
                    (migration["name"],),
                )
            connection.commit()

    def _applied(self, connection: sqlite3.Connection, name: str) -> bool:
        row = connection.execute(
            "SELECT 1 FROM schema_migrations WHERE name = ?",
            (name,),
        ).fetchone()
        return row is not None

    def _migrations(self) -> List[dict]:
        return [
            {
                "name": "001_create_escrows_table",
                "sql": """
                CREATE TABLE IF NOT EXISTS escrows (
                    payment_hash TEXT PRIMARY KEY,
                    preimage TEXT NOT NULL,
                    amount_sats INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    tracking_number TEXT,
                    description TEXT,
                    expiry INTEGER NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
                """,
            }
        ]
