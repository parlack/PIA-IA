"""Servicio de autenticacion: login, registro, set-password."""
from typing import Optional
from fastapi import HTTPException, Request
from core.security import (
    validar_curp,
    verify_password,
    store_password,
    rol_canonico,
    es_rol_privilegiado,
    needs_rehash,
    PASSWORD_MIN_LEN,
)
from services import audit_service


def _validate_curp_or_raise(curp: str) -> str:
    curp_upper = curp.strip().upper()
    valida, msg = validar_curp(curp_upper)
    if not valida:
        raise HTTPException(status_code=400, detail=msg)
    return curp_upper


def autenticar_usuario(
    db,
    curp: str,
    contrasena: str | None,
    request: Optional[Request] = None,
) -> dict:
    """Intenta autenticar. Devuelve dict con info publica del usuario."""
    curp_norm = _validate_curp_or_raise(curp)

    with db.cursor() as cur:
        cur.execute(
            "SELECT curp, nombre, apellido_paterno, correo, contrasena_hash, rol, "
            "acepto_terminos "
            "FROM usuarios WHERE curp = %s",
            (curp_norm,),
        )
        user = cur.fetchone()

    if not user:
        audit_service.log_event(
            db, actor_curp=curp_norm, accion="login_fail_no_user",
            recurso="usuarios", recurso_id=curp_norm, request=request,
        )
        raise HTTPException(
            status_code=404,
            detail={
                "message": "CURP no encontrado.",
                "registrable": True,
            },
        )

    rol_user = rol_canonico(user["rol"])

    if es_rol_privilegiado(rol_user) and not contrasena:
        audit_service.log_event(
            db, actor_curp=user["curp"], accion="login_fail_privilegiado_sin_password",
            recurso="usuarios", recurso_id=user["curp"], request=request,
        )
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Este usuario requiere contrasena para iniciar sesion.",
                "rol": rol_user,
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
            audit_service.log_event(
                db, actor_curp=user["curp"], accion="login_fail_password",
                recurso="usuarios", recurso_id=user["curp"], request=request,
            )
            raise HTTPException(status_code=401, detail="Contrasena incorrecta.")
        autenticado = True

        if needs_rehash(user["contrasena_hash"]):
            with db.cursor() as cur2:
                cur2.execute(
                    "UPDATE usuarios SET contrasena_hash = %s WHERE curp = %s",
                    (store_password(contrasena), user["curp"]),
                )
            db.commit()

    with db.cursor() as cur3:
        cur3.execute(
            "UPDATE usuarios SET ultimo_acceso = NOW() WHERE curp = %s",
            (user["curp"],),
        )
    db.commit()

    audit_service.log_event(
        db, actor_curp=user["curp"],
        accion="login_completo" if autenticado else "login_rapido",
        recurso="usuarios", recurso_id=user["curp"], request=request,
    )

    return {
        "autenticado":      autenticado,
        "curp":             user["curp"],
        "nombre":           user["nombre"],
        "apellido_paterno": user["apellido_paterno"],
        "correo":           user["correo"],
        "rol":              rol_user,
        "acepto_terminos":  bool(user["acepto_terminos"]),
    }


def actualizar_password(
    db,
    curp: str,
    contrasena_nueva: str,
    request: Optional[Request] = None,
) -> None:
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

    audit_service.log_event(
        db, actor_curp=curp_norm, accion="set_password",
        recurso="usuarios", recurso_id=curp_norm, request=request,
    )


def aceptar_terminos(db, curp: str, request: Optional[Request] = None) -> None:
    curp_norm = _validate_curp_or_raise(curp)
    with db.cursor() as cur:
        cur.execute(
            "UPDATE usuarios SET acepto_terminos = 1, "
            "fecha_aceptacion_terminos = NOW() WHERE curp = %s",
            (curp_norm,),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    db.commit()
    audit_service.log_event(
        db, actor_curp=curp_norm, accion="aceptar_terminos",
        recurso="usuarios", recurso_id=curp_norm, request=request,
    )
