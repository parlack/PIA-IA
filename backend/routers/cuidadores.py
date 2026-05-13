"""Endpoints de cuidadores / dependientes."""
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from core.database import get_db
from services import cuidador_service, audit_service

router = APIRouter(prefix="/cuidadores", tags=["cuidadores"])


class DependienteIn(BaseModel):
    curp_cuidador: str
    curp_dependiente: str
    relacion: str = Field(..., min_length=2, max_length=40)


@router.get("/{curp_cuidador}")
def listar(curp_cuidador: str, db = Depends(get_db)):
    return cuidador_service.listar_dependientes(db, curp_cuidador)


@router.post("")
def agregar(data: DependienteIn, request: Request, db = Depends(get_db)):
    new_id = cuidador_service.agregar_dependiente(
        db, data.curp_cuidador, data.curp_dependiente, data.relacion,
    )
    audit_service.log_event(
        db, actor_curp=data.curp_cuidador.upper(), accion="agregar_dependiente",
        recurso="cuidadores", recurso_id=new_id, request=request,
        datos={"dependiente": data.curp_dependiente.upper(), "relacion": data.relacion},
    )
    return {"ok": True, "id": new_id}


@router.delete("/{cuidador_id}")
def eliminar(cuidador_id: int, request: Request, db = Depends(get_db)):
    cuidador_service.eliminar_dependiente(db, cuidador_id)
    audit_service.log_event(
        db, actor_curp=None, accion="eliminar_dependiente",
        recurso="cuidadores", recurso_id=cuidador_id, request=request,
    )
    return {"ok": True}
