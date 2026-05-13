"""Reportes agregados para el panel administrativo."""
from typing import Optional


def cobertura_por_estado(db) -> list[dict]:
    """Total usuarios y dosis aplicadas agrupados por estado."""
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT um.estado AS estado,
                   COUNT(DISTINCT u.curp) AS usuarios,
                   COUNT(h.id) AS dosis
            FROM unidades_medicas um
            LEFT JOIN usuarios u ON u.unidad_medica_id = um.id
            LEFT JOIN historial_vacunas h ON h.curp_usuario = u.curp
            GROUP BY um.estado
            ORDER BY dosis DESC
            """
        )
        return cur.fetchall()


def cobertura_por_unidad(db) -> list[dict]:
    """Total usuarios y dosis por unidad medica."""
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT um.id, um.nombre, um.estado, um.ciudad, um.lat, um.lng,
                   COUNT(DISTINCT u.curp) AS usuarios,
                   COUNT(h.id) AS dosis
            FROM unidades_medicas um
            LEFT JOIN usuarios u ON u.unidad_medica_id = um.id
            LEFT JOIN historial_vacunas h ON h.curp_usuario = u.curp
            GROUP BY um.id
            ORDER BY um.nombre
            """
        )
        rows = cur.fetchall()
    for r in rows:
        if r.get("lat") is not None:
            r["lat"] = float(r["lat"])
        if r.get("lng") is not None:
            r["lng"] = float(r["lng"])
    return rows


def cobertura_por_grupo(db) -> list[dict]:
    """Total por grupo prioritario con dosis aplicadas."""
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT u.grupo_prioritario AS grupo,
                   COUNT(DISTINCT u.curp) AS usuarios,
                   COUNT(h.id) AS dosis
            FROM usuarios u
            LEFT JOIN historial_vacunas h ON h.curp_usuario = u.curp
            WHERE u.rol = 'usuario'
            GROUP BY u.grupo_prioritario
            ORDER BY usuarios DESC
            """
        )
        return cur.fetchall()


def vacunas_por_mes(db, meses: int = 12) -> list[dict]:
    """Dosis aplicadas por mes (ultimos N meses)."""
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT DATE_FORMAT(fecha_aplicacion, '%%Y-%%m') AS mes,
                   COUNT(*) AS dosis
            FROM historial_vacunas
            WHERE fecha_aplicacion >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
            GROUP BY mes
            ORDER BY mes ASC
            """,
            (meses,),
        )
        return cur.fetchall()


def cobertura_global_por_vacuna(db) -> list[dict]:
    """Para cada vacuna del catalogo, calcula la cobertura % vs total usuarios."""
    with db.cursor() as cur:
        cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'usuario'")
        total_u = cur.fetchone()["total"] or 1
        cur.execute(
            """
            SELECT v.id, v.nombre, v.dosis_total,
                   COUNT(DISTINCT h.curp_usuario) AS usuarios_con_al_menos_una,
                   COUNT(h.id) AS dosis_totales
            FROM vacunas_catalogo v
            LEFT JOIN historial_vacunas h ON h.vacuna_id = v.id
            GROUP BY v.id
            ORDER BY v.id
            """
        )
        rows = cur.fetchall()
    for r in rows:
        r["cobertura_pct"] = round(
            100.0 * (r["usuarios_con_al_menos_una"] or 0) / total_u, 1,
        )
    return rows


def candidatos_call_recall(db, dias_atraso_minimo: int = 30) -> list[dict]:
    """Usuarios con esquema incompleto cuya ultima dosis fue hace > N dias."""
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT u.curp, u.nombre, u.apellido_paterno, u.correo, u.celular,
                   u.grupo_prioritario,
                   COALESCE(MAX(h.fecha_aplicacion), '1900-01-01') AS ultima_dosis,
                   (SELECT SUM(v2.dosis_total) FROM vacunas_catalogo v2) AS dosis_totales,
                   COUNT(h.id) AS dosis_aplicadas
            FROM usuarios u
            LEFT JOIN historial_vacunas h ON h.curp_usuario = u.curp
            WHERE u.rol = 'usuario'
            GROUP BY u.curp
            HAVING DATEDIFF(CURDATE(), ultima_dosis) > %s
               AND dosis_aplicadas < dosis_totales
            ORDER BY ultima_dosis ASC
            LIMIT 200
            """,
            (dias_atraso_minimo,),
        )
        rows = cur.fetchall()
    for r in rows:
        r["ultima_dosis"] = str(r["ultima_dosis"])
    return rows
