"""Endpoints AEFI (eventos adversos post-vacunacion)."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field
from core.database import get_db
from core.constants import AEFI_VENTANA_DIAS
from services import aefi_service, audit_service

router = APIRouter(prefix="/aefi", tags=["aefi"])


class AefiIn(BaseModel):
    dosis_id: int
    sintomas: str = Field(..., min_length=3)
    severidad: str = "leve"
    inicio_minutos: Optional[int] = None
    requiere_seguimiento: bool = False


@router.get(
    "/usuario/{curp}",
    summary="Reportes AEFI del ciudadano",
)
def por_usuario(curp: str, db = Depends(get_db)):
    return aefi_service.listar_por_usuario(db, curp)


@router.get(
    "/usuario/{curp}/dosis-reportables",
    summary="Dosis elegibles para reportar AEFI",
    description=(
        f"Solo se pueden reportar reacciones dentro de los {AEFI_VENTANA_DIAS} "
        "dias posteriores a la aplicacion de la dosis. Este endpoint devuelve la "
        "lista filtrada para alimentar el selector del frontend."
    ),
)
def dosis_reportables(curp: str, db = Depends(get_db)):
    """Dosis del usuario que aun estan dentro de la ventana para reportar AEFI."""
    return {
        "ventana_dias": AEFI_VENTANA_DIAS,
        "dosis": aefi_service.dosis_reportables(db, curp),
    }


@router.get(
    "",
    summary="Listar reportes AEFI (admin)",
)
def listar(
    severidad: Optional[str] = Query(None, description="Filtra por severidad: leve, moderada, severa, grave"),
    limit: int = Query(200, ge=1, le=1000),
    db = Depends(get_db),
):
    return aefi_service.listar_para_admin(db, severidad, limit)


@router.post(
    "",
    summary="Reportar evento adverso (AEFI)",
    description=(
        "Valida que la dosis se haya aplicado dentro de los "
        f"{AEFI_VENTANA_DIAS} dias previos. Severidades permitidas: "
        "`leve`, `moderada`, `severa`, `grave`."
    ),
)
def reportar(data: AefiIn, request: Request, db = Depends(get_db)):
    new_id = aefi_service.reportar(
        db,
        dosis_id=data.dosis_id,
        sintomas=data.sintomas,
        severidad=data.severidad,
        inicio_minutos=data.inicio_minutos,
        requiere_seguimiento=data.requiere_seguimiento,
    )
    audit_service.log_event(
        db, actor_curp=None, accion="reportar_aefi",
        recurso="aefi_reportes", recurso_id=new_id, request=request,
        datos={"severidad": data.severidad, "dosis_id": data.dosis_id},
    )
    return {"ok": True, "id": new_id}
