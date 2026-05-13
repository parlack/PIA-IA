"""Endpoints de alergias y contraindicaciones."""
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from core.database import get_db
from services import alergia_service, audit_service

router = APIRouter(prefix="/alergias", tags=["alergias"])


class AlergiaIn(BaseModel):
    curp: str
    sustancia: str = Field(..., min_length=1, max_length=120)
    severidad: str = "leve"
    observaciones: Optional[str] = None


class ContraindicacionIn(BaseModel):
    curp: str
    descripcion: str = Field(..., min_length=3)
    vacuna_id: Optional[int] = None
    permanente: bool = False


@router.get("/{curp}")
def listar(curp: str, db = Depends(get_db)):
    return {
        "alergias":          alergia_service.listar_alergias(db, curp),
        "contraindicaciones": alergia_service.listar_contraindicaciones(db, curp),
    }


@router.post("")
def crear_alergia(data: AlergiaIn, request: Request, db = Depends(get_db)):
    new_id = alergia_service.crear_alergia(
        db, data.curp, data.sustancia, data.severidad, data.observaciones,
    )
    audit_service.log_event(
        db, actor_curp=data.curp.upper(), accion="crear_alergia",
        recurso="alergias", recurso_id=new_id, request=request,
        datos={"sustancia": data.sustancia, "severidad": data.severidad},
    )
    return {"ok": True, "id": new_id}


@router.delete("/{alergia_id}")
def eliminar_alergia(alergia_id: int, request: Request, db = Depends(get_db)):
    alergia_service.eliminar_alergia(db, alergia_id)
    audit_service.log_event(
        db, actor_curp=None, accion="eliminar_alergia",
        recurso="alergias", recurso_id=alergia_id, request=request,
    )
    return {"ok": True}


@router.post("/contraindicaciones")
def crear_contraindicacion(data: ContraindicacionIn, request: Request, db = Depends(get_db)):
    new_id = alergia_service.crear_contraindicacion(
        db, data.curp, data.descripcion, data.vacuna_id, data.permanente,
    )
    audit_service.log_event(
        db, actor_curp=data.curp.upper(), accion="crear_contraindicacion",
        recurso="contraindicaciones", recurso_id=new_id, request=request,
    )
    return {"ok": True, "id": new_id}


@router.delete("/contraindicaciones/{cid}")
def eliminar_contraindicacion(cid: int, request: Request, db = Depends(get_db)):
    alergia_service.eliminar_contraindicacion(db, cid)
    audit_service.log_event(
        db, actor_curp=None, accion="eliminar_contraindicacion",
        recurso="contraindicaciones", recurso_id=cid, request=request,
    )
    return {"ok": True}
