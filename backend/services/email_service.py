"""Cliente de correo transaccional usando la API de Yolani Mail.

Envia correos via POST multipart a `https://api.yolani.co/api/mail/v1/{DOMAIN}/messages`
con `Authorization: Bearer ${YOLANI_MAIL_API_KEY}`.

Variables de entorno requeridas (cargadas desde .env):
- YOLANI_MAIL_API_KEY     API key (formato `yk-...`). Si esta vacia, el servicio
                          opera en modo "stub" (loguea sin enviar).
- YOLANI_MAIL_API_URL     URL base (default: `https://api.yolani.co`).
- YOLANI_MAIL_DOMAIN      Dominio verificado (default: `yolani.co`).
- YOLANI_MAIL_FROM        From completo (default: `PIA-IA <no-reply@yolani.co>`).
"""
from __future__ import annotations

import io
import json
import mimetypes
import os
import uuid
from typing import Iterable, Optional, Tuple
import urllib.request
import urllib.error


def _settings() -> dict:
    return {
        "api_key": os.getenv("YOLANI_MAIL_API_KEY", "").strip(),
        "api_url": os.getenv("YOLANI_MAIL_API_URL", "https://api.yolani.co").rstrip("/"),
        "domain":  os.getenv("YOLANI_MAIL_DOMAIN", "yolani.co").strip(),
        "from":    os.getenv("YOLANI_MAIL_FROM", "PIA-IA <no-reply@yolani.co>").strip(),
    }


def _build_multipart(fields: dict, files: list[Tuple[str, str, bytes]]) -> Tuple[bytes, str]:
    """Construye un payload multipart/form-data sin dependencias externas."""
    boundary = f"----piaia{uuid.uuid4().hex}"
    buf = io.BytesIO()

    def write(line: bytes) -> None:
        buf.write(line)
        buf.write(b"\r\n")

    for key, value in fields.items():
        if value is None:
            continue
        write(f"--{boundary}".encode())
        write(f'Content-Disposition: form-data; name="{key}"'.encode())
        write(b"")
        write(str(value).encode("utf-8"))

    for field_name, filename, content in files:
        ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        write(f"--{boundary}".encode())
        write(
            f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'
            .encode()
        )
        write(f"Content-Type: {ctype}".encode())
        write(b"")
        write(content)

    buf.write(f"--{boundary}--\r\n".encode())
    return buf.getvalue(), f"multipart/form-data; boundary={boundary}"


def _normalize_to(destinatarios: str | Iterable[str]) -> str:
    if isinstance(destinatarios, str):
        return destinatarios
    return ", ".join([d for d in destinatarios if d])


def enviar(
    destinatarios: str | Iterable[str],
    asunto: str,
    *,
    html: Optional[str] = None,
    texto: Optional[str] = None,
    cc: Optional[str | Iterable[str]] = None,
    bcc: Optional[str | Iterable[str]] = None,
    remitente: Optional[str] = None,
    adjuntos: Optional[list[Tuple[str, bytes]]] = None,
) -> dict:
    """Envia un correo transaccional via Yolani.

    Retorna `{"ok": True, "id": ...}` cuando la API responde 200.
    Si no hay API key configurada, retorna `{"ok": True, "stub": True}`.
    """
    cfg = _settings()
    to_str = _normalize_to(destinatarios)
    if not to_str:
        return {"ok": False, "error": "destinatario vacio"}
    if not (html or texto):
        return {"ok": False, "error": "debe incluir html o texto"}

    if not cfg["api_key"]:
        print(f"[yolani] (stub) Para: {to_str} | {asunto}")
        return {"ok": True, "stub": True, "destinatario": to_str}

    fields = {
        "from":    remitente or cfg["from"],
        "to":      to_str,
        "subject": asunto,
    }
    if texto:
        fields["text"] = texto
    if html:
        fields["html"] = html
    if cc:
        fields["cc"] = _normalize_to(cc)
    if bcc:
        fields["bcc"] = _normalize_to(bcc)

    files: list[Tuple[str, str, bytes]] = []
    if adjuntos:
        for nombre, contenido in adjuntos:
            files.append(("attachments", nombre, contenido))

    body, content_type = _build_multipart(fields, files)
    url = f"{cfg['api_url']}/api/mail/v1/{cfg['domain']}/messages"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {cfg['api_key']}",
            "Content-Type":  content_type,
            "User-Agent":    "PIA-IA/3.0 (+https://pia-ia.mx)",
            "Accept":        "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {"raw": raw[:300]}
        return {"ok": True, "id": data.get("id"), "respuesta": data}
    except urllib.error.HTTPError as e:
        try:
            detalle = json.loads(e.read().decode("utf-8", errors="replace"))
        except Exception:
            detalle = {"status": e.code}
        return {"ok": False, "status": e.code, "error": detalle}
    except urllib.error.URLError as e:
        return {"ok": False, "error": str(e.reason)}


def notificar_dosis_aplicada(
    *,
    destinatario:  str,
    nombre:        str,
    vacuna:        str,
    numero_dosis:  int,
    dosis_total:   Optional[int],
    fecha:         str,
    unidad:        Optional[str],
    lote:          Optional[str],
) -> dict:
    """Envia confirmacion al ciudadano cuando un medico registra una dosis."""
    if not destinatario:
        return {"ok": False, "error": "ciudadano sin correo registrado"}

    dosis_texto = f"{numero_dosis}"
    if dosis_total:
        dosis_texto += f" de {dosis_total}"

    detalles = [
        f"<b>Vacuna:</b> {vacuna}",
        f"<b>Dosis:</b> {dosis_texto}",
        f"<b>Fecha de aplicacion:</b> {fecha}",
    ]
    if unidad:
        detalles.append(f"<b>Unidad medica:</b> {unidad}")
    if lote:
        detalles.append(f"<b>Lote:</b> {lote}")

    detalles_html = "".join(f"<p style='margin:6px 0;font-size:14px'>{d}</p>" for d in detalles)

    html = f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:Helvetica,Arial,sans-serif;color:#1C1B17">
  <div style="max-width:560px;margin:0 auto;padding:40px 32px;background:#FFFFFF;border:1px solid #E7E1D4">
    <p style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6B6358;margin:0 0 10px">
      PIA-IA / cartilla digital
    </p>
    <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 18px;font-weight:500;color:#1C1B17">
      Nueva dosis registrada
    </h1>
    <p style="font-size:15px;line-height:1.55;margin:0 0 18px">
      Hola {nombre}, te confirmamos que se registro una nueva dosis en tu
      expediente electronico.
    </p>
    <div style="border-top:1px solid #E7E1D4;border-bottom:1px solid #E7E1D4;padding:14px 0;margin:18px 0">
      {detalles_html}
    </div>
    <p style="font-size:13px;line-height:1.55;margin:0 0 22px;color:#4A4940">
      Si tu no acudiste a esta aplicacion, por favor comunicate con tu unidad medica.
      Puedes consultar tu cartilla completa en PIA-IA.
    </p>
    <p style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8B8073;margin:32px 0 0">
      Mensaje generado automaticamente · no responder
    </p>
  </div>
</body></html>"""

    texto = (
        f"Hola {nombre},\n\n"
        f"Se registro una nueva dosis en tu expediente PIA-IA:\n"
        f"  - Vacuna: {vacuna}\n"
        f"  - Dosis: {dosis_texto}\n"
        f"  - Fecha: {fecha}\n"
        + (f"  - Unidad: {unidad}\n" if unidad else "")
        + (f"  - Lote: {lote}\n" if lote else "")
        + "\nSi tu no acudiste a esta aplicacion, comunicate con tu unidad medica."
    )

    return enviar(
        destinatarios=destinatario,
        asunto=f"Dosis registrada: {vacuna}",
        html=html,
        texto=texto,
    )
