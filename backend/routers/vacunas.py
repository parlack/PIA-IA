from fastapi import APIRouter, Depends
from core.database import get_db
from models import VacunaRegistro, VacunaRegistroUpdate, CatalogoVacuna
from services import vacuna_service

router = APIRouter(prefix="/vacunas", tags=["vacunas"])


# Historial
@router.post("/historial")
def registrar_dosis(data: VacunaRegistro, db = Depends(get_db)):
    new_id = vacuna_service.registrar_dosis(db, data)
    return {"ok": True, "id": new_id}


@router.patch("/historial/{dosis_id}")
def update_dosis(dosis_id: int, data: VacunaRegistroUpdate, db = Depends(get_db)):
    vacuna_service.actualizar_dosis(db, dosis_id, data.dict())
    return {"ok": True}


@router.delete("/historial/{dosis_id}")
def delete_dosis(dosis_id: int, db = Depends(get_db)):
    vacuna_service.eliminar_dosis(db, dosis_id)
    return {"ok": True}


# Catalogo
@router.get("/catalogo")
def get_catalogo(db = Depends(get_db)):
    return vacuna_service.listar_catalogo(db)


@router.post("/catalogo")
def crear_catalogo(data: CatalogoVacuna, db = Depends(get_db)):
    new_id = vacuna_service.crear_catalogo(db, data)
    return {"ok": True, "id": new_id}


@router.patch("/catalogo/{vacuna_id}")
def update_catalogo(vacuna_id: int, data: CatalogoVacuna, db = Depends(get_db)):
    vacuna_service.actualizar_catalogo(db, vacuna_id, data)
    return {"ok": True}


@router.delete("/catalogo/{vacuna_id}")
def delete_catalogo(vacuna_id: int, db = Depends(get_db)):
    vacuna_service.eliminar_catalogo(db, vacuna_id)
    return {"ok": True}
