from typing import Optional
from pydantic import BaseModel


class UsuarioUpdate(BaseModel):
    nombre:            Optional[str] = None
    apellido_paterno:  Optional[str] = None
    apellido_materno:  Optional[str] = None
    celular:           Optional[str] = None
    correo:            Optional[str] = None
    unidad_medica_id:  Optional[int] = None
    medico_familiar:   Optional[str] = None
    nss:               Optional[str] = None
    grupo_prioritario: Optional[str] = None
    fecha_nacimiento:  Optional[str] = None
    sexo:              Optional[str] = None


class AdminCrearUsuario(BaseModel):
    curp: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: Optional[str] = None
    celular: Optional[str] = None
    rol: str = "usuario"
