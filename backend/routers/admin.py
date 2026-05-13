from typing import Optional
from fastapi import APIRouter, Depends, Query
from core.database import get_db
from models import AdminCrearUsuario
from services import usuario_service, vacuna_service, stats_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/usuarios")
def listar_usuarios(
    rol: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    unidad_medica_id: Optional[int] = Query(None),
    db = Depends(get_db),
):
    return usuario_service.listar_usuarios(db, rol, search, unidad_medica_id)


@router.post("/usuarios")
def crear_usuario(req: AdminCrearUsuario, db = Depends(get_db)):
    curp = usuario_service.crear_usuario_admin(db, req)
    return {"ok": True, "curp": curp}


@router.delete("/usuarios/{curp}")
def eliminar_usuario(curp: str, db = Depends(get_db)):
    usuario_service.eliminar_usuario_cascade(db, curp)
    return {"ok": True}


@router.get("/usuarios/{curp}/vacunas")
def get_vacunas_usuario(curp: str, db = Depends(get_db)):
    return vacuna_service.obtener_historial(db, curp)


@router.get("/stats")
def get_stats(db = Depends(get_db)):
    return stats_service.obtener_estadisticas(db)
