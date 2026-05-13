"""Endpoints de citas para vacunacion."""
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from core.database import get_db
from services import cita_service, audit_service

router = APIRouter(prefix="/citas", tags=["citas"])


class CitaIn(BaseModel):
    curp_usuario: str
    vacuna_id: int
    unidad_medica_id: int
    fecha_hora: str
    notas: Optional[str] = None


class EstadoIn(BaseModel):
    estado: str = Field(..., min_length=2, max_length=20)


@router.get("/usuario/{curp}")
def por_usuario(curp: str, db = Depends(get_db)):
    return cita_service.listar_por_usuario(db, curp)


@router.post("")
def crear(data: CitaIn, request: Request, db = Depends(get_db)):
    new_id = cita_service.crear_cita(
        db,
        curp_usuario=data.curp_usuario,
        vacuna_id=data.vacuna_id,
        unidad_medica_id=data.unidad_medica_id,
        fecha_hora=data.fecha_hora,
        notas=data.notas,
    )
    audit_service.log_event(
        db, actor_curp=data.curp_usuario.upper(), accion="crear_cita",
        recurso="citas", recurso_id=new_id, request=request,
    )
    return {"ok": True, "id": new_id}


@router.patch("/{cita_id}")
def actualizar(cita_id: int, data: EstadoIn, request: Request, db = Depends(get_db)):
    cita_service.actualizar_estado(db, cita_id, data.estado)
    audit_service.log_event(
        db, actor_curp=None, accion="actualizar_cita",
        recurso="citas", recurso_id=cita_id, request=request,
        datos={"estado": data.estado},
    )
    return {"ok": True}


@router.delete("/{cita_id}")
def eliminar(cita_id: int, request: Request, db = Depends(get_db)):
    cita_service.eliminar_cita(db, cita_id)
    audit_service.log_event(
        db, actor_curp=None, accion="eliminar_cita",
        recurso="citas", recurso_id=cita_id, request=request,
    )
    return {"ok": True}
