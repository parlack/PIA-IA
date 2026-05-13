"""Endpoints de push notifications + call & recall."""
from fastapi import APIRouter, Depends, Query, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from core.database import get_db
from core.constants import REMITENTE_SISTEMA_DEFAULT
from services import push_service, reporte_service, audit_service, mensaje_service, email_service
from models import MensajeCreate

router = APIRouter(prefix="/push", tags=["push"])


class TokenIn(BaseModel):
    curp: str
    token: str


class BroadcastIn(BaseModel):
    curps: list[str]
    titulo: str
    cuerpo: str


class EmailIn(BaseModel):
    destinatario: EmailStr
    asunto: str
    html: str


@router.post(
    "/token",
    summary="Registrar Expo Push Token del ciudadano",
)
def registrar_token(data: TokenIn, request: Request, db = Depends(get_db)):
    push_service.registrar_token(db, data.curp, data.token)
    audit_service.log_event(
        db, actor_curp=data.curp.upper(), accion="registrar_push_token",
        recurso="usuarios", recurso_id=data.curp.upper(), request=request,
    )
    return {"ok": True}


@router.post(
    "/broadcast",
    summary="Enviar push masivo a una lista de CURPs",
)
def broadcast(data: BroadcastIn, request: Request, db = Depends(get_db)):
    res = push_service.enviar_a_curps(db, data.curps, data.titulo, data.cuerpo)
    audit_service.log_event(
        db, actor_curp=None, accion="broadcast_admin",
        recurso="push", recurso_id=None, request=request,
        datos={"destinatarios": len(data.curps), "titulo": data.titulo},
    )
    return res


@router.post(
    "/call-recall",
    summary="Ejecutar campania call & recall",
    description="Identifica ciudadanos con esquema vencido y les envia push + mensaje al buzon.",
)
def disparar_call_recall(
    request: Request,
    background: BackgroundTasks,
    dias: int = Query(30, ge=7, le=365),
    db = Depends(get_db),
):
    """Identifica usuarios con esquema vencido y les envia push + mensaje al buzon."""
    candidatos = reporte_service.candidatos_call_recall(db, dias)
    if not candidatos:
        return {"ok": True, "candidatos": 0, "enviados": 0}

    curps = [c["curp"] for c in candidatos]
    titulo = "Tu esquema de vacunacion necesita atencion"
    cuerpo = (
        "Detectamos que tienes dosis pendientes. Agenda una visita a tu unidad "
        "medica o consulta tu cartilla digital para conocer las vacunas faltantes."
    )

    for c in candidatos:
        try:
            mensaje_service.enviar_mensaje(db, MensajeCreate(
                destinatario_curp=c["curp"],
                remitente_curp=REMITENTE_SISTEMA_DEFAULT,
                titulo=titulo,
                contenido=cuerpo,
                tipo="recordatorio",
            ))
        except Exception:
            pass

    res = push_service.enviar_a_curps(db, curps, titulo, cuerpo,
                                       datos={"tipo": "call_recall"})

    audit_service.log_event(
        db, actor_curp=None, accion="call_recall_ejecutado",
        recurso="push", recurso_id=None, request=request,
        datos={"candidatos": len(candidatos), "dias_minimos": dias},
    )

    return {
        "ok": True,
        "candidatos": len(candidatos),
        "push_result": res,
    }


@router.post(
    "/email",
    summary="Enviar correo transaccional via Yolani Mail",
    description=(
        "Requiere `YOLANI_MAIL_API_KEY` configurada en `.env`. "
        "Sin esa variable el servicio opera en modo stub (loguea sin enviar)."
    ),
)
def enviar_email_admin(data: EmailIn, request: Request, db = Depends(get_db)):
    """Envia un correo transaccional via Yolani Mail (uso administrativo)."""
    resultado = email_service.enviar(data.destinatario, data.asunto, html=data.html)
    audit_service.log_event(
        db, actor_curp=None, accion="email_enviado",
        recurso="correo", recurso_id=data.destinatario, request=request,
        datos={"asunto": data.asunto, "ok": resultado.get("ok", False)},
    )
    return resultado
