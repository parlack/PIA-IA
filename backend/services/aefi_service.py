"""Servicio AEFI (eventos adversos post-vacunacion)."""
from typing import Optional
from datetime import date, timedelta
from fastapi import HTTPException

from core.constants import AEFI_VENTANA_DIAS

VALID_SEVERIDADES = {"leve", "moderada", "severa", "grave"}


def dosis_reportables(db, curp: str) -> list[dict]:
    """Dosis del usuario dentro de la ventana de reporte AEFI."""
    limite = date.today() - timedelta(days=AEFI_VENTANA_DIAS)
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT h.id, h.numero_dosis, h.fecha_aplicacion, h.lote,
                   v.nombre AS vacuna_nombre, v.id AS vacuna_id,
                   DATEDIFF(CURDATE(), h.fecha_aplicacion) AS dias_transcurridos
            FROM historial_vacunas h
            JOIN vacunas_catalogo v ON v.id = h.vacuna_id
            WHERE h.curp_usuario = %s
              AND h.fecha_aplicacion >= %s
            ORDER BY h.fecha_aplicacion DESC
            """,
            (curp.upper(), limite),
        )
        rows = cur.fetchall()
    for r in rows:
        r["fecha_aplicacion"] = str(r["fecha_aplicacion"])
    return rows


def listar_por_usuario(db, curp: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT a.*, h.fecha_aplicacion, h.lote, v.nombre AS vacuna_nombre
            FROM aefi_reportes a
            JOIN historial_vacunas h ON h.id = a.dosis_id
            JOIN vacunas_catalogo v ON v.id = h.vacuna_id
            WHERE a.curp_usuario = %s
            ORDER BY a.creado_en DESC
            """,
            (curp.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
        r["fecha_aplicacion"] = str(r["fecha_aplicacion"])
    return rows


def reportar(
    db,
    *,
    dosis_id: int,
    sintomas: str,
    severidad: str,
    inicio_minutos: Optional[int],
    requiere_seguimiento: bool,
) -> int:
    if severidad not in VALID_SEVERIDADES:
        raise HTTPException(status_code=400, detail=f"Severidad invalida: {severidad}.")
    if not sintomas.strip():
        raise HTTPException(status_code=400, detail="Los sintomas son obligatorios.")
    with db.cursor() as cur:
        cur.execute(
            "SELECT curp_usuario, fecha_aplicacion, "
            "DATEDIFF(CURDATE(), fecha_aplicacion) AS dias "
            "FROM historial_vacunas WHERE id = %s",
            (dosis_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dosis no encontrada.")
        if row["dias"] is not None and row["dias"] > AEFI_VENTANA_DIAS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Esta dosis fue aplicada hace {row['dias']} dias. "
                    f"Solo se pueden reportar reacciones dentro de los "
                    f"{AEFI_VENTANA_DIAS} dias posteriores a la aplicacion."
                ),
            )
        curp = row["curp_usuario"]
        cur.execute(
            """
            INSERT INTO aefi_reportes
              (dosis_id, curp_usuario, sintomas, severidad,
               inicio_minutos, requiere_seguimiento)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                dosis_id, curp, sintomas.strip(), severidad,
                inicio_minutos, 1 if requiere_seguimiento else 0,
            ),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def listar_para_admin(db, severidad: Optional[str] = None, limit: int = 200) -> list[dict]:
    where, params = [], []
    if severidad:
        where.append("a.severidad = %s")
        params.append(severidad)
    sql = """
        SELECT a.*, u.nombre, u.apellido_paterno, u.grupo_prioritario,
               v.nombre AS vacuna_nombre, h.fecha_aplicacion
        FROM aefi_reportes a
        JOIN usuarios u ON u.curp = a.curp_usuario
        JOIN historial_vacunas h ON h.id = a.dosis_id
        JOIN vacunas_catalogo v ON v.id = h.vacuna_id
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY a.creado_en DESC LIMIT %s"
    params.append(max(1, min(limit, 1000)))
    with db.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
        r["fecha_aplicacion"] = str(r["fecha_aplicacion"])
    return rows
