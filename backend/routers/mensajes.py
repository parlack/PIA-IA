from fastapi import APIRouter, Depends
from core.database import get_db
from models import MensajeCreate
from services import mensaje_service

router = APIRouter(prefix="/buzon", tags=["buzon"])


@router.get("/{curp}")
def get_mensajes(curp: str, db = Depends(get_db)):
    return mensaje_service.listar_mensajes(db, curp)


@router.post("")
def enviar_mensaje(data: MensajeCreate, db = Depends(get_db)):
    new_id = mensaje_service.enviar_mensaje(db, data)
    return {"ok": True, "id": new_id}


@router.patch("/{mensaje_id}/leer")
def marcar_leido(mensaje_id: int, db = Depends(get_db)):
    mensaje_service.marcar_leido(db, mensaje_id)
    return {"ok": True}


@router.delete("/{mensaje_id}")
def delete_mensaje(mensaje_id: int, db = Depends(get_db)):
    mensaje_service.eliminar_mensaje(db, mensaje_id)
    return {"ok": True}
