from datetime import date
from typing import Optional
from pydantic import BaseModel


class VacunaRegistro(BaseModel):
    curp_usuario:     str
    vacuna_id:        int
    numero_dosis:     int
    fecha_aplicacion: date
    lugar_aplicacion: Optional[str] = None
    lote:             Optional[str] = None
    modificado_por:   str


class VacunaRegistroUpdate(BaseModel):
    fecha_aplicacion: Optional[date] = None
    lugar_aplicacion: Optional[str] = None
    lote:             Optional[str] = None


class CatalogoVacuna(BaseModel):
    nombre:            str
    enfermedad:        str
    dosis_descripcion: Optional[str] = None
    dosis_total:       int = 1
