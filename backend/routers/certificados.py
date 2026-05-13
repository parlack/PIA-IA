"""Endpoints de certificados (PDF) y verificacion por QR."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel

from core.database import get_db
from core.rate_limit import limiter
from core.security import rol_canonico, validar_curp
from models import VacunaRegistro
from services import (
    certificado_service,
    vacuna_service,
    usuario_service,
    audit_service,
)

router = APIRouter(prefix="/certificados", tags=["certificados"])


class AplicarPorTokenPayload(BaseModel):
    token:             str
    vacuna_id:         int
    numero_dosis:      int
    fecha_aplicacion:  date
    lugar_aplicacion:  Optional[str] = None
    lote:              Optional[str] = None
    actor_curp:        str


@router.get(
    "/{curp}/pdf",
    summary="Descargar cartilla en PDF",
    description="Genera el PDF firmado con historial completo y QR personal en la primera pagina.",
    responses={200: {"content": {"application/pdf": {}}}},
)
@limiter.limit("10/minute")
def descargar_pdf(curp: str, request: Request, db = Depends(get_db)):
    base_url = str(request.base_url).rstrip("/")
    pdf_bytes = certificado_service.construir_pdf_cartilla(db, curp, base_url)
    audit_service.log_event(
        db, actor_curp=curp.upper(), accion="descarga_pdf",
        recurso="usuarios", recurso_id=curp.upper(), request=request,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="cartilla-{curp.upper()}.pdf"',
        },
    )


@router.get(
    "/{curp}/qr-token",
    summary="Obtener token persistente para QR personal",
    description=(
        "Devuelve un token de 24h asociado al ciudadano. Si ya existe uno "
        "vigente en BD, se reutiliza (asi un screenshot guardado por el usuario "
        "sigue siendo valido). Pasar `regenerar=true` para invalidar el actual."
    ),
)
def obtener_qr_token(curp: str, regenerar: bool = False, db = Depends(get_db)):
    usuario_service.obtener_usuario(db, curp)
    token, expira_en = certificado_service.generar_token_qr(
        db, curp, forzar_nuevo=regenerar,
    )
    return {
        "token":            token,
        "expira_en":        86400,
        "expira_en_iso":    expira_en.isoformat(),
    }


@router.get(
    "/verificar/{token}",
    summary="Verificar token QR personal",
    description="Endpoint publico que un vacunador puede usar para confirmar la cartilla del ciudadano sin requerir login.",
)
def verificar_qr(token: str, request: Request, db = Depends(get_db)):
    curp = certificado_service.verificar_token_qr(db, token)
    if not curp:
        return {"valido": False}
    info = usuario_service.obtener_usuario(db, curp)
    resumen = vacuna_service.obtener_historial(db, curp)
    audit_service.log_event(
        db, actor_curp=None, accion="verificacion_qr",
        recurso="usuarios", recurso_id=curp, request=request,
    )
    return {
        "valido": True,
        "usuario": {
            "curp": info["curp"],
            "nombre": info["nombre"],
            "apellido_paterno": info["apellido_paterno"],
            "apellido_materno": info.get("apellido_materno"),
            "grupo_prioritario": info.get("grupo_prioritario"),
        },
        "resumen": resumen["resumen"],
        "total_dosis": len(resumen["historial"]),
    }


@router.post(
    "/aplicar-por-token",
    summary="Aplicar dosis a partir de un token QR escaneado",
    description=(
        "Permite a un administrador o medico registrar una dosis para el "
        "ciudadano asociado a un token QR sin necesidad de teclear su CURP. "
        "Requiere que `actor_curp` corresponda a un usuario con rol admin o medico."
    ),
)
@limiter.limit("30/minute")
def aplicar_por_token(
    payload: AplicarPorTokenPayload,
    request: Request,
    db = Depends(get_db),
):
    actor = payload.actor_curp.strip().upper()
    valida, msg = validar_curp(actor)
    if not valida:
        raise HTTPException(status_code=400, detail=f"CURP del actor invalida: {msg}")

    with db.cursor() as cur:
        cur.execute("SELECT curp, rol FROM usuarios WHERE curp = %s", (actor,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="El actor no existe en el sistema.")
    if rol_canonico(row["rol"]) not in {"admin", "medico"}:
        raise HTTPException(
            status_code=403,
            detail="Solo administradores o medicos pueden aplicar dosis por QR.",
        )

    curp_paciente = certificado_service.verificar_token_qr(db, payload.token)
    if not curp_paciente:
        raise HTTPException(
            status_code=400,
            detail="Token QR invalido o caducado. Pide al ciudadano un QR nuevo.",
        )

    registro = VacunaRegistro(
        curp_usuario=curp_paciente,
        vacuna_id=payload.vacuna_id,
        numero_dosis=payload.numero_dosis,
        fecha_aplicacion=payload.fecha_aplicacion,
        lugar_aplicacion=payload.lugar_aplicacion,
        lote=payload.lote,
        modificado_por=actor,
    )
    new_id = vacuna_service.registrar_dosis(db, registro)

    audit_service.log_event(
        db, actor_curp=actor, accion="aplicar_por_qr",
        recurso="historial_vacunas", recurso_id=str(new_id), request=request,
    )

    info = usuario_service.obtener_usuario(db, curp_paciente)
    return {
        "ok": True,
        "id": new_id,
        "usuario": {
            "curp": info["curp"],
            "nombre": info["nombre"],
            "apellido_paterno": info["apellido_paterno"],
            "apellido_materno": info.get("apellido_materno"),
        },
    }
