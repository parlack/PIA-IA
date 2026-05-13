"""Servicio de gestion de usuarios."""
from fastapi import HTTPException
from core.security import validar_curp, rol_canonico

CAMPOS_ACTUALIZABLES = {
    "nombre", "apellido_paterno", "apellido_materno",
    "celular", "correo", "unidad_medica_id",
    "medico_familiar", "nss",
    "grupo_prioritario", "fecha_nacimiento", "sexo",
}


def obtener_usuario(db, curp: str) -> dict:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT u.curp, u.nombre, u.apellido_paterno, u.apellido_materno,
                   u.celular, u.correo, u.rol, u.nss, u.medico_familiar,
                   u.grupo_prioritario, u.fecha_nacimiento, u.sexo,
                   u.creado_en,
                   um.nombre AS unidad_nombre, um.telefono AS unidad_telefono,
                   um.ciudad, um.estado
            FROM usuarios u
            LEFT JOIN unidades_medicas um ON u.unidad_medica_id = um.id
            WHERE u.curp = %s
            """,
            (curp.upper(),),
        )
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    user["rol"] = rol_canonico(user["rol"])
    for key in ("creado_en", "fecha_nacimiento"):
        if user.get(key):
            user[key] = str(user[key])
    return user


def actualizar_usuario(db, curp: str, data_dict: dict) -> None:
    fields = {
        k: v for k, v in data_dict.items()
        if v is not None and k in CAMPOS_ACTUALIZABLES
    }
    if not fields:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar.")

    sets = ", ".join(f"`{k}` = %s" for k in fields)
    vals = list(fields.values()) + [curp.upper()]

    with db.cursor() as cur:
        cur.execute(f"UPDATE usuarios SET {sets} WHERE curp = %s", vals)
    db.commit()


def crear_usuario_admin(db, payload) -> str:
    curp = payload.curp.strip().upper()
    valida, msg = validar_curp(curp)
    if not valida:
        raise HTTPException(status_code=400, detail=msg)
    if not payload.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre es requerido.")
    if not payload.apellido_paterno.strip():
        raise HTTPException(status_code=400, detail="El apellido paterno es requerido.")

    correo = (payload.correo or "").strip() or None

    with db.cursor() as cur:
        cur.execute("SELECT curp FROM usuarios WHERE curp = %s", (curp,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Esta CURP ya esta registrada.")

        if correo:
            cur.execute("SELECT curp FROM usuarios WHERE correo = %s", (correo,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Este correo ya esta registrado.")

        cur.execute(
            """
            INSERT INTO usuarios (curp, nombre, apellido_paterno, apellido_materno, correo, celular, rol)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                curp,
                payload.nombre.strip(),
                payload.apellido_paterno.strip(),
                (payload.apellido_materno or "").strip() or None,
                correo,
                (payload.celular or "").strip() or None,
                payload.rol.strip() or "usuario",
            ),
        )
    db.commit()
    return curp


def eliminar_usuario_cascade(db, curp: str) -> None:
    target = curp.upper()
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM historial_vacunas WHERE curp_usuario = %s",
            (target,),
        )
        cur.execute(
            "DELETE FROM mensajes_buzon WHERE destinatario_curp = %s OR remitente_curp = %s",
            (target, target),
        )
        cur.execute("DELETE FROM usuarios WHERE curp = %s", (target,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    db.commit()


def listar_usuarios(
    db,
    rol: str | None,
    search: str | None,
    unidad_medica_id: int | None,
) -> list[dict]:
    sql = """
        SELECT u.curp, u.nombre, u.apellido_paterno, u.apellido_materno,
               u.correo, u.celular, u.rol, u.nss, u.creado_en,
               u.unidad_medica_id, u.grupo_prioritario, u.fecha_nacimiento, u.sexo,
               um.nombre AS unidad_nombre
        FROM usuarios u
        LEFT JOIN unidades_medicas um ON u.unidad_medica_id = um.id
        WHERE 1=1
    """
    params: list = []
    if rol:
        sql += " AND u.rol = %s"
        params.append(rol)
    if unidad_medica_id is not None:
        sql += " AND u.unidad_medica_id = %s"
        params.append(unidad_medica_id)
    if search:
        sql += " AND (u.curp LIKE %s OR u.nombre LIKE %s OR u.apellido_paterno LIKE %s)"
        like = f"%{search}%"
        params.extend([like, like, like])
    sql += " ORDER BY u.creado_en DESC"

    with db.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    for r in rows:
        r["creado_en"] = str(r["creado_en"])
        r["rol"] = rol_canonico(r.get("rol"))
    return rows
