"""Aplica la migracion 2026_05_13_add_medico_role.sql usando las credenciales de .env."""
import os
import pathlib
import sys

import pymysql
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

HOST = os.getenv("DB_HOST")
PORT = int(os.getenv("DB_PORT", "3306"))
USER = os.getenv("DB_USER")
PWD = os.getenv("DB_PASSWORD")
DB = os.getenv("DB_NAME")

MIGRATION = ROOT / "migrations" / "2026_05_13_add_medico_role.sql"


def run_statements(sql: str):
    cleaned: list[str] = []
    for raw in sql.splitlines():
        line = raw.strip()
        if not line or line.startswith("--"):
            continue
        cleaned.append(line)
    joined = " ".join(cleaned)
    statements = [s.strip() for s in joined.split(";") if s.strip()]
    print(f"[migracion] {len(statements)} sentencia(s) a ejecutar")

    conn = pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PWD,
        database=DB,
        charset="utf8mb4",
        autocommit=False,
    )
    try:
        with conn.cursor() as cur:
            for idx, stmt in enumerate(statements, start=1):
                preview = (stmt[:90] + "...") if len(stmt) > 90 else stmt
                print(f"  -> [{idx}/{len(statements)}] {preview}")
                cur.execute(stmt)
        conn.commit()
        print("[migracion] commit OK")

        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM usuarios LIKE 'rol'")
            col = cur.fetchone()
            print(f"[verificacion] columna rol -> {col}")
            cur.execute(
                "SELECT curp, nombre, apellido_paterno, rol "
                "FROM usuarios WHERE rol = 'medico'"
            )
            rows = cur.fetchall()
            print(f"[verificacion] {len(rows)} medico(s) registrado(s):")
            for r in rows:
                print(f"   {r}")
    except Exception as exc:
        conn.rollback()
        print(f"[migracion] ERROR -> rollback. Detalle: {exc}")
        raise
    finally:
        conn.close()


def main():
    if not MIGRATION.exists():
        print(f"No existe {MIGRATION}", file=sys.stderr)
        sys.exit(1)
    sql = MIGRATION.read_text(encoding="utf-8")
    print(f"[migracion] aplicando {MIGRATION.name} en {HOST}:{PORT}/{DB}")
    run_statements(sql)


if __name__ == "__main__":
    main()
