"""Servicio de vacunas: historial, catalogo, calculo de resumen."""
from fastapi import HTTPException
from core.constants import VACUNAS_PRIORITARIAS_POR_GRUPO


def obtener_historial(db, curp: str) -> dict:
    curp_upper = curp.upper()
    with db.cursor() as cur:
        cur.execute("SELECT id, nombre, dosis_total FROM vacunas_catalogo ORDER BY id")
        catalogo = cur.fetchall()

        cur.execute(
            """
            SELECT h.id, h.vacuna_id, h.numero_dosis, h.fecha_aplicacion,
                   h.lugar_aplicacion, h.lote, h.registrado_en,
                   v.nombre AS vacuna_nombre, v.dosis_total
            FROM historial_vacunas h
            JOIN vacunas_catalogo v ON h.vacuna_id = v.id
            WHERE h.curp_usuario = %s
            ORDER BY h.fecha_aplicacion DESC
            """,
            (curp_upper,),
        )
        historial = cur.fetchall()

    dosis_por_vacuna: dict[int, list] = {}
    for h in historial:
        dosis_por_vacuna.setdefault(h["vacuna_id"], []).append(h)

    resumen = []
    for v in catalogo:
        aplicadas = dosis_por_vacuna.get(v["id"], [])
        ultima = max((r["fecha_aplicacion"] for r in aplicadas), default=None)
        resumen.append({
            "vacuna_id":       v["id"],
            "nombre":          v["nombre"],
            "dosis_total":     v["dosis_total"],
            "dosis_aplicadas": len(aplicadas),
            "completa":        len(aplicadas) >= v["dosis_total"],
            "ultima_fecha":    str(ultima) if ultima else None,
        })

    for h in historial:
        h["fecha_aplicacion"] = str(h["fecha_aplicacion"])
        h["registrado_en"]    = str(h["registrado_en"])

    return {"resumen": resumen, "historial": historial}


def registrar_dosis(db, payload) -> int:
    with db.cursor() as cur:
        cur.execute("SELECT id FROM vacunas_catalogo WHERE id = %s", (payload.vacuna_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Vacuna no encontrada en el catalogo.")

        cur.execute("SELECT curp FROM usuarios WHERE curp = %s", (payload.curp_usuario.upper(),))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        cur.execute(
            """
            INSERT INTO historial_vacunas
              (curp_usuario, vacuna_id, numero_dosis, fecha_aplicacion,
               lugar_aplicacion, lote, modificado_por)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload.curp_usuario.upper(),
                payload.vacuna_id,
                payload.numero_dosis,
                payload.fecha_aplicacion,
                payload.lugar_aplicacion,
                payload.lote,
                payload.modificado_por.upper(),
            ),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def actualizar_dosis(db, dosis_id: int, data_dict: dict) -> None:
    fields = {k: v for k, v in data_dict.items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar.")

    sets = ", ".join(f"`{k}` = %s" for k in fields)
    vals = list(fields.values()) + [dosis_id]
    with db.cursor() as cur:
        cur.execute(f"UPDATE historial_vacunas SET {sets} WHERE id = %s", vals)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
    db.commit()


def eliminar_dosis(db, dosis_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM historial_vacunas WHERE id = %s", (dosis_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado.")
    db.commit()


def listar_catalogo(db) -> list[dict]:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM vacunas_catalogo ORDER BY id")
        return cur.fetchall()


def _validar_catalogo(payload) -> None:
    if not payload.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre de la vacuna es requerido.")
    if not payload.enfermedad.strip():
        raise HTTPException(status_code=400, detail="La enfermedad es requerida.")
    if payload.dosis_total < 1:
        raise HTTPException(status_code=400, detail="El total de dosis debe ser al menos 1.")


def crear_catalogo(db, payload) -> int:
    _validar_catalogo(payload)
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO vacunas_catalogo (nombre, enfermedad, dosis_descripcion, dosis_total)
            VALUES (%s, %s, %s, %s)
            """,
            (payload.nombre.strip(), payload.enfermedad.strip(), payload.dosis_descripcion, payload.dosis_total),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def actualizar_catalogo(db, vacuna_id: int, payload) -> None:
    _validar_catalogo(payload)
    with db.cursor() as cur:
        cur.execute(
            """
            UPDATE vacunas_catalogo
            SET nombre=%s, enfermedad=%s, dosis_descripcion=%s, dosis_total=%s
            WHERE id=%s
            """,
            (payload.nombre.strip(), payload.enfermedad.strip(), payload.dosis_descripcion, payload.dosis_total, vacuna_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Vacuna no encontrada.")
    db.commit()


def eliminar_catalogo(db, vacuna_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM vacunas_catalogo WHERE id = %s", (vacuna_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Vacuna no encontrada.")
    db.commit()


def calcular_alertas(db, curp: str) -> dict:
    """Calcula alertas de vacunas pendientes priorizadas por grupo."""
    curp_upper = curp.upper()

    with db.cursor() as cur:
        cur.execute(
            "SELECT curp, grupo_prioritario, fecha_nacimiento FROM usuarios WHERE curp = %s",
            (curp_upper,),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        cur.execute("SELECT id, nombre, dosis_total FROM vacunas_catalogo ORDER BY id")
        catalogo = cur.fetchall()

        cur.execute(
            """
            SELECT vacuna_id, COUNT(*) AS aplicadas
            FROM historial_vacunas
            WHERE curp_usuario = %s
            GROUP BY vacuna_id
            """,
            (curp_upper,),
        )
        aplicadas_map = {r["vacuna_id"]: r["aplicadas"] for r in cur.fetchall()}

    grupo = user.get("grupo_prioritario") or "ninguno"
    vacunas_prioritarias = VACUNAS_PRIORITARIAS_POR_GRUPO.get(grupo, set())

    alertas: list[dict] = []
    for v in catalogo:
        aplicadas = aplicadas_map.get(v["id"], 0)
        faltantes = v["dosis_total"] - aplicadas
        if faltantes <= 0:
            continue
        alertas.append({
            "vacuna_id":       v["id"],
            "nombre":          v["nombre"],
            "dosis_faltantes": faltantes,
            "dosis_total":     v["dosis_total"],
            "dosis_aplicadas": aplicadas,
            "prioridad":       "alta" if v["id"] in vacunas_prioritarias else "normal",
        })

    alertas.sort(key=lambda a: (0 if a["prioridad"] == "alta" else 1, a["vacuna_id"]))
    return {"alertas": alertas, "grupo_prioritario": grupo}
