"""Smoke test del rol medico: simula autenticacion completa y verifica rutas."""
import os
import pathlib
import sys

import pymysql
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "backend"))

from services import auth_service  # noqa: E402
from core.security import rol_canonico, es_rol_privilegiado  # noqa: E402


def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def case(label: str, curp: str, password: str | None):
    print(f"\n=== {label} ===  (curp={curp}, password={'***' if password else 'None'})")
    db = get_db()
    try:
        try:
            data = auth_service.autenticar_usuario(db, curp, password)
        except Exception as exc:
            print(f"  -> Excepcion: {type(exc).__name__}: {exc}")
            return
        rol = data.get("rol")
        canonico = rol_canonico(rol)
        privilegiado = es_rol_privilegiado(canonico)
        print(f"  -> rol api          = {rol!r}")
        print(f"  -> rol canonico     = {canonico!r}")
        print(f"  -> es_privilegiado  = {privilegiado}")
        print(f"  -> nombre completo  = {data.get('nombre')} {data.get('apellido_paterno')}")
    finally:
        db.close()


def main():
    case("Medico Daniela con password 123", "MEDI800101HNLDDC01", "123")
    case("Medico Rodrigo con password 123", "MEDI750505HNLDDR02", "123")
    case("Medico Daniela SIN password (deberia fallar logica privilegiado)", "MEDI800101HNLDDC01", None)
    case("Admin con password 123 (control)", "XEXX010101HNEXXXA4", "123")
    case("Usuario ciudadano con password 123 (control)", "MAGL850305MNLRMS04", "123")


if __name__ == "__main__":
    main()
