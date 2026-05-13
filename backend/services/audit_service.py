"""Servicio de auditoria: registro de acciones sensibles."""
from __future__ import annotations
import json
from typing import Optional

from fastapi import Request


def _client_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def log_event(
    db,
    *,
    actor_curp: Optional[str],
    accion: str,
    recurso: Optional[str] = None,
    recurso_id: Optional[str] = None,
    datos: Optional[dict] = None,
    request: Optional[Request] = None,
) -> None:
    """Registra un evento en `audit_log`. Nunca lanza al caller."""
    try:
        ip = _client_ip(request)
        ua = request.headers.get("user-agent") if request else None
        datos_json = json.dumps(datos, default=str) if datos else None
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO audit_log
                  (curp_actor, accion, recurso, recurso_id, ip, user_agent, datos_json)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    (actor_curp or "")[:18] or None,
                    accion[:60],
                    recurso[:80] if recurso else None,
                    str(recurso_id)[:60] if recurso_id is not None else None,
                    ip[:45] if ip else None,
                    ua[:300] if ua else None,
                    datos_json,
                ),
            )
        db.commit()
    except Exception as e:
        try:
            print(f"[audit] fallo registro: {e}")
        except Exception:
            pass


def listar_eventos(
    db,
    *,
    limit: int = 100,
    actor_curp: Optional[str] = None,
    accion: Optional[str] = None,
) -> list[dict]:
    where = []
    params: list = []
    if actor_curp:
        where.append("curp_actor = %s")
        params.append(actor_curp.upper())
    if accion:
        where.append("accion LIKE %s")
        params.append(f"%{accion}%")
    sql = "SELECT * FROM audit_log"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY creado_en DESC LIMIT %s"
    params.append(max(1, min(limit, 500)))
    with db.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()
    for r in rows:
        r["creado_en"] = str(r["creado_en"])
    return rows
