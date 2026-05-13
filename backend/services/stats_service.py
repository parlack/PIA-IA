"""Servicio de estadisticas para el panel admin."""


def obtener_estadisticas(db) -> dict:
    with db.cursor() as cur:
        cur.execute("SELECT COUNT(*) AS total FROM usuarios")
        total_usuarios = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*) AS total FROM historial_vacunas")
        total_dosis = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*) AS total FROM mensajes_buzon WHERE leido=0")
        mensajes_no_leidos = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*) AS total FROM vacunas_catalogo")
        total_vacunas_catalogo = cur.fetchone()["total"]

        cur.execute(
            """
            SELECT v.nombre, COUNT(*) AS aplicaciones
            FROM historial_vacunas h
            JOIN vacunas_catalogo v ON h.vacuna_id = v.id
            GROUP BY h.vacuna_id, v.nombre
            ORDER BY aplicaciones DESC
            LIMIT 5
            """
        )
        top_vacunas = cur.fetchall()

        cur.execute(
            """
            SELECT grupo_prioritario, COUNT(*) AS total
            FROM usuarios
            WHERE grupo_prioritario != 'ninguno'
            GROUP BY grupo_prioritario
            """
        )
        grupos = cur.fetchall()

        cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE sexo = 'H'")
        total_hombres = cur.fetchone()["total"]
        cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE sexo = 'M'")
        total_mujeres = cur.fetchone()["total"]

    return {
        "total_usuarios":         total_usuarios,
        "total_dosis":            total_dosis,
        "mensajes_no_leidos":     mensajes_no_leidos,
        "total_vacunas_catalogo": total_vacunas_catalogo,
        "top_vacunas":            top_vacunas,
        "grupos_prioritarios":    grupos,
        "total_hombres":          total_hombres,
        "total_mujeres":          total_mujeres,
    }
