from internal.escrow.migrations import MigrationRunner


def test_migration_runner_creates_schema(tmp_path):
    db_path = tmp_path / "migrations.sqlite3"
    runner = MigrationRunner(str(db_path))

    runner.run()

    import sqlite3

    with sqlite3.connect(db_path) as connection:
        tables = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()

    names = {row[0] for row in tables}
    assert "escrows" in names
    assert "schema_migrations" in names
