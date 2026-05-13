from pydantic import BaseModel


class MensajeCreate(BaseModel):
    destinatario_curp: str
    remitente_curp:    str
    titulo:            str
    contenido:         str
    tipo:              str = "informacion"
