from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    curp: str
    contrasena: Optional[str] = None


class SetPasswordRequest(BaseModel):
    curp: str
    contrasena: str


class RegistroRequest(BaseModel):
    curp: str
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    correo: Optional[str] = None
    celular: Optional[str] = None
