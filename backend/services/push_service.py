"""Servicio de notificaciones: Expo push + email (Yolani Mail API)."""
from __future__ import annotations
import json
from typing import Iterable, Optional
import urllib.request
import urllib.error

from services import audit_service, email_service


EXPO_URL = "https://exp.host/--/api/v2/push/send"


def registrar_token(db, curp: str, token: str) -> None:
    with db.cursor() as cur:
        cur.execute(
            "UPDATE usuarios SET expo_push_token = %s WHERE curp = %s",
            (token, curp.upper()),
        )
    db.commit()


def _enviar_expo(messages: list[dict]) -> dict:
    if not messages:
        return {"ok": True, "enviados": 0}
    data = json.dumps(messages).encode("utf-8")
    req = urllib.request.Request(
        EXPO_URL,
        data=data,
        headers={
            "Accept":       "application/json",
            "Accept-Encoding": "identity",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="replace")
        return {"ok": True, "enviados": len(messages), "respuesta": body[:300]}
    except urllib.error.URLError as e:
        return {"ok": False, "error": str(e)}


def enviar_a_curps(db, curps: Iterable[str], titulo: str, cuerpo: str,
                   datos: Optional[dict] = None) -> dict:
    curps_u = [c.upper() for c in curps]
    if not curps_u:
        return {"ok": True, "enviados": 0}
    placeholders = ",".join(["%s"] * len(curps_u))
    with db.cursor() as cur:
        cur.execute(
            f"SELECT curp, expo_push_token FROM usuarios "
            f"WHERE curp IN ({placeholders}) AND expo_push_token IS NOT NULL",
            tuple(curps_u),
        )
        rows = cur.fetchall()
    messages = [
        {
            "to":    r["expo_push_token"],
            "title": titulo,
            "body":  cuerpo,
            "data":  datos or {},
            "sound": "default",
        }
        for r in rows if r["expo_push_token"]
    ]
    result = _enviar_expo(messages)
    audit_service.log_event(
        db, actor_curp=None, accion="push_broadcast",
        recurso="push", recurso_id=None,
        datos={"destinatarios": len(messages), "titulo": titulo,
               "resultado": result.get("ok", False)},
    )
    return result


def enviar_email(destinatario: str, asunto: str, cuerpo_html: str) -> dict:
    """Envia un correo transaccional via Yolani Mail API."""
    return email_service.enviar(destinatario, asunto, html=cuerpo_html)
