"""Servicio de citas para vacunacion."""
from typing import Optional
from datetime import datetime
from fastapi import HTTPException


VALID_ESTADOS = {"programada", "completada", "cancelada", "no_asistio"}


def listar_por_usuario(db, curp: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT c.*, v.nombre AS vacuna_nombre, u.nombre AS unidad_nombre,
                   u.direccion AS unidad_direccion, u.lat, u.lng
            FROM citas c
            JOIN vacunas_catalogo v ON v.id = c.vacuna_id
            JOIN unidades_medicas u ON u.id = c.unidad_medica_id
            WHERE c.curp_usuario = %s
            ORDER BY c.fecha_hora DESC
            """,
            (curp.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["fecha_hora"] = str(r["fecha_hora"])
        r["creado_en"] = str(r["creado_en"])
    return rows


def crear_cita(
    db,
    *,
    curp_usuario: str,
    vacuna_id: int,
    unidad_medica_id: int,
    fecha_hora: str,
    notas: Optional[str] = None,
) -> int:
    try:
        dt = datetime.fromisoformat(fecha_hora.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha/hora invalida.")
    if dt < datetime.now():
        raise HTTPException(status_code=400, detail="La cita debe ser a futuro.")
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO citas
              (curp_usuario, vacuna_id, unidad_medica_id, fecha_hora, notas)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (curp_usuario.upper(), vacuna_id, unidad_medica_id, dt, notas),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def actualizar_estado(db, cita_id: int, estado: str) -> None:
    if estado not in VALID_ESTADOS:
        raise HTTPException(status_code=400, detail=f"Estado invalido: {estado}.")
    with db.cursor() as cur:
        cur.execute(
            "UPDATE citas SET estado = %s WHERE id = %s",
            (estado, cita_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cita no encontrada.")
    db.commit()


def eliminar_cita(db, cita_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM citas WHERE id = %s", (cita_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cita no encontrada.")
    db.commit()
