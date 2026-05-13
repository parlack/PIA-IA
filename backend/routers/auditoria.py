"""Endpoints de auditoria (lectura, solo admin)."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from core.database import get_db
from services import audit_service

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


@router.get("")
def listar(
    actor: Optional[str] = Query(None),
    accion: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db = Depends(get_db),
):
    return audit_service.listar_eventos(db, limit=limit, actor_curp=actor, accion=accion)
