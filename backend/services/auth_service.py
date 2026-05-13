"""Servicio de autenticacion: login, registro, set-password."""
from fastapi import HTTPException
from core.security import (
    validar_curp,
    verify_password,
    store_password,
    rol_canonico,
    PASSWORD_MIN_LEN,
)


def _validate_curp_or_raise(curp: str) -> str:
    curp_upper = curp.strip().upper()
    valida, msg = validar_curp(curp_upper)
    if not valida:
        raise HTTPException(status_code=400, detail=msg)
    return curp_upper


def autenticar_usuario(db, curp: str, contrasena: str | None) -> dict:
    """Intenta autenticar. Devuelve dict con info publica del usuario."""
    curp_norm = _validate_curp_or_raise(curp)

    with db.cursor() as cur:
        cur.execute(
            "SELECT curp, nombre, apellido_paterno, correo, contrasena_hash, rol "
            "FROM usuarios WHERE curp = %s",
            (curp_norm,),
        )
        user = cur.fetchone()

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "CURP no encontrado.",
                "registrable": True,
            },
        )

    autenticado = False
    if contrasena:
        if not user["contrasena_hash"]:
            raise HTTPException(
                status_code=401,
                detail="Este usuario no tiene contrasena configurada.",
            )
        if not verify_password(contrasena, user["contrasena_hash"]):
            raise HTTPException(status_code=401, detail="Contrasena incorrecta.")
        autenticado = True

    return {
        "autenticado":      autenticado,
        "curp":             user["curp"],
        "nombre":           user["nombre"],
        "apellido_paterno": user["apellido_paterno"],
        "correo":           user["correo"],
        "rol":              rol_canonico(user["rol"]),
    }


def actualizar_password(db, curp: str, contrasena_nueva: str) -> None:
    curp_norm = _validate_curp_or_raise(curp)
    if len(contrasena_nueva) < PASSWORD_MIN_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"La contrasena debe tener al menos {PASSWORD_MIN_LEN} caracteres.",
        )

    with db.cursor() as cur:
        cur.execute("SELECT curp FROM usuarios WHERE curp = %s", (curp_norm,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        cur.execute(
            "UPDATE usuarios SET contrasena_hash = %s WHERE curp = %s",
            (store_password(contrasena_nueva), curp_norm),
        )
    db.commit()
