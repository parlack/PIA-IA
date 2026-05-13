"""Servicio de buzon: mensajes entre admin y usuarios."""
from fastapi import HTTPException
from core.constants import TIPOS_MENSAJE


def listar_mensajes(db, curp: str) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT m.id, m.titulo, m.contenido, m.tipo, m.leido,
                   m.enviado_en, m.leido_en,
                   u.nombre AS remitente_nombre, u.apellido_paterno AS remitente_apellido
            FROM mensajes_buzon m
            JOIN usuarios u ON m.remitente_curp = u.curp
            WHERE m.destinatario_curp = %s
            ORDER BY m.enviado_en DESC
            """,
            (curp.upper(),),
        )
        rows = cur.fetchall()
    for r in rows:
        r["enviado_en"] = str(r["enviado_en"])
        r["leido_en"]   = str(r["leido_en"]) if r["leido_en"] else None
    return rows


def enviar_mensaje(db, payload) -> int:
    if payload.tipo not in TIPOS_MENSAJE:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo invalido. Use: {', '.join(TIPOS_MENSAJE)}.",
        )
    if not payload.titulo.strip():
        raise HTTPException(status_code=400, detail="El titulo es requerido.")
    if not payload.contenido.strip():
        raise HTTPException(status_code=400, detail="El contenido es requerido.")

    with db.cursor() as cur:
        cur.execute(
            "SELECT curp FROM usuarios WHERE curp = %s",
            (payload.destinatario_curp.upper(),),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Destinatario no encontrado.")

        cur.execute(
            """
            INSERT INTO mensajes_buzon
              (destinatario_curp, remitente_curp, titulo, contenido, tipo)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                payload.destinatario_curp.upper(),
                payload.remitente_curp.upper(),
                payload.titulo.strip(),
                payload.contenido.strip(),
                payload.tipo,
            ),
        )
        new_id = cur.lastrowid
    db.commit()
    return new_id


def marcar_leido(db, mensaje_id: int) -> None:
    with db.cursor() as cur:
        cur.execute(
            "UPDATE mensajes_buzon SET leido=1, leido_en=NOW() WHERE id=%s",
            (mensaje_id,),
        )
    db.commit()


def eliminar_mensaje(db, mensaje_id: int) -> None:
    with db.cursor() as cur:
        cur.execute("DELETE FROM mensajes_buzon WHERE id=%s", (mensaje_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado.")
    db.commit()
