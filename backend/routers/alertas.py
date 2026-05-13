from fastapi import APIRouter, Depends
from core.database import get_db
from services import vacuna_service

router = APIRouter(prefix="/alertas", tags=["alertas"])


@router.get("/{curp}")
def get_alertas(curp: str, db = Depends(get_db)):
    return vacuna_service.calcular_alertas(db, curp)
