"""Smoke test del flujo completo medico->QR->dosis."""
import os
import pathlib
import sys
from datetime import date

import pymysql
from dotenv import load_dotenv

ROOT = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "backend"))

from services import certificado_service, vacuna_service, usuario_service  # noqa: E402
from models import VacunaRegistro  # noqa: E402
from core.security import rol_canonico  # noqa: E402


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


def main():
    paciente_curp = "MAGL850305MNLRMS04"
    medico_curp = "MEDI800101HNLDDC01"

    db = get_db()
    try:
        print("1) Verifico rol del medico en BD")
        with db.cursor() as cur:
            cur.execute("SELECT curp, rol FROM usuarios WHERE curp = %s", (medico_curp,))
            row = cur.fetchone()
        print(f"   medico = {row}, canonico = {rol_canonico(row['rol'])}")

        print("2) Genero token QR del paciente Laura Martinez")
        token, expira = certificado_service.generar_token_qr(db, paciente_curp, forzar_nuevo=True)
        print(f"   token = {token[:24]}...  expira = {expira}")

        print("3) Verifico el token (lo que hace el medico al escanear)")
        curp_resuelta = certificado_service.verificar_token_qr(db, token)
        print(f"   curp resuelta = {curp_resuelta}")
        assert curp_resuelta == paciente_curp

        info = usuario_service.obtener_usuario(db, curp_resuelta)
        print(f"   paciente = {info['nombre']} {info['apellido_paterno']}")

        print("4) Registro una dosis con el medico como modificado_por")
        registro = VacunaRegistro(
            curp_usuario=curp_resuelta,
            vacuna_id=12,
            numero_dosis=1,
            fecha_aplicacion=date.today(),
            lugar_aplicacion="UMF No. 27 (smoke test)",
            lote="LOTE-SMK-001",
            modificado_por=medico_curp,
        )
        new_id = vacuna_service.registrar_dosis(db, registro)
        db.commit()
        print(f"   id historial creado = {new_id}")

        print("5) Verifico que la dosis quedo registrada con el medico como aplicador")
        with db.cursor() as cur:
            cur.execute(
                "SELECT id, curp_usuario, vacuna_id, fecha_aplicacion, lugar_aplicacion, lote, modificado_por "
                "FROM historial_vacunas WHERE id = %s",
                (new_id,),
            )
            dosis = cur.fetchone()
        print(f"   dosis = {dosis}")

        print("\nOK: flujo end-to-end medico->QR->dosis funciona.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
