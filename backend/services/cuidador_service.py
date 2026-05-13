"""Servicio de cuidadores: un ciudadano gestiona a sus dependientes."""
from fastapi import HTTPException


def listar_dependientes(db, curp_cuidador: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.relacion, c.creado_en,
                   u.curp, u.nombre, u.apellido_paterno, u.apellido_materno,
                   u.grupo_prioritario, u.fecha_nacimiento, u.celular
            FROM cuidadores c
            JOIN usuarios u ON u.curp = c.curp_dependiente
            WHERE c.curp_cuidador = %s
            ORDER BY c.creado_en DESC
            """,
            (curp_cuidador.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
        if r.get("fecha_nacimiento"):
            r["fecha_nacimiento"] = str(r["fecha_nacimiento"])
    return rows


def agregar_dependiente(
    db, curp_cuidador: str, curp_dependiente: str, relacion: str,
) -> int:
    cuidador = curp_cuidador.upper()
    dep = curp_dependiente.upper()
    if cuidador == dep:
        raise HTTPException(status_code=400, detail="No puedes ser tu propio dependiente.")
    if not relacion.strip():
        raise HTTPException(status_code=400, detail="La relacion es obligatoria.")
    with db.cursor() as cur:
        cur.execute("SELECT curp FROM usuarios WHERE curp IN (%s, %s)", (cuidador, dep))
        existentes = {r["curp"] for r in cur.fetchall()}
        if cuidador not in existentes:
            raise HTTPException(status_code=404, detail="Cuidador no existe.")
        if dep not in existentes:
            raise HTTPException(status_code=404, detail="Dependiente no existe.")
        try:
            cur.execute(
                """
                INSERT INTO cuidadores (curp_cuidador, curp_dependiente, relacion)
                VALUES (%s, %s, %s)
                """,
                (cuidador, dep, relacion.strip()),
            )
        except Exception as e:
            if "Duplicate" in str(e):
                raise HTTPException(status_code=409, detail="Esa relacion ya existe.")
            raise
        new_id = cur.lastrowid
    db.commit()
    return new_id


def eliminar_dependiente(db, cuidador_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM cuidadores WHERE id = %s", (cuidador_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Relacion no encontrada.")
    db.commit()
