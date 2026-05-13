"""Servicio de alergias y contraindicaciones."""
from typing import Optional
from fastapi import HTTPException


VALID_SEVERIDADES = {"leve", "moderada", "severa", "anafilaxia"}


def listar_alergias(db, curp: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT * FROM alergias WHERE curp_usuario = %s ORDER BY creado_en DESC",
            (curp.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
    return rows


def crear_alergia(db, curp: str, sustancia: str, severidad: str, observaciones: Optional[str]) -> int:
    if not sustancia.strip():
        raise HTTPException(status_code=400, detail="La sustancia es obligatoria.")
    if severidad not in VALID_SEVERIDADES:
        raise HTTPException(status_code=400, detail=f"Severidad invalida: {severidad}.")
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO alergias (curp_usuario, sustancia, severidad, observaciones)
            VALUES (%s, %s, %s, %s)
            """,
            (curp.upper(), sustancia.strip(), severidad, observaciones),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def eliminar_alergia(db, alergia_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM alergias WHERE id = %s", (alergia_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alergia no encontrada.")
    db.commit()


def listar_contraindicaciones(db, curp: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT c.*, v.nombre AS vacuna_nombre
            FROM contraindicaciones c
            LEFT JOIN vacunas_catalogo v ON v.id = c.vacuna_id
            WHERE c.curp_usuario = %s
            ORDER BY c.creado_en DESC
            """,
            (curp.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
    return rows


def crear_contraindicacion(
    db,
    curp: str,
    descripcion: str,
    vacuna_id: Optional[int] = None,
    permanente: bool = False,
) -> int:
    if not descripcion.strip():
        raise HTTPException(status_code=400, detail="La descripcion es obligatoria.")
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO contraindicaciones (curp_usuario, vacuna_id, descripcion, permanente)
            VALUES (%s, %s, %s, %s)
            """,
            (curp.upper(), vacuna_id, descripcion.strip(), 1 if permanente else 0),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def eliminar_contraindicacion(db, cid: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM contraindicaciones WHERE id = %s", (cid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Contraindicacion no encontrada.")
    db.commit()
