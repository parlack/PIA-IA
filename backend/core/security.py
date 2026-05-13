"""Funciones de seguridad: passwords y validacion CURP.

NOTA: store_password actualmente no hashea. Reemplazar por bcrypt/argon2
cuando se requiera produccion.
"""
import re

CURP_REGEX = re.compile(r"^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$")

CODIGOS_ESTADO_CURP: frozenset[str] = frozenset({
    "AS", "BC", "BS", "CC", "CS", "CH", "CL", "CM", "DF", "DG",
    "GT", "GR", "HG", "JC", "MC", "MN", "MS", "MO", "NT", "NL",
    "OC", "PL", "QT", "QR", "SP", "SL", "SR", "TC", "TS", "TL",
    "VZ", "YN", "ZS", "NE",
})

PASSWORD_MIN_LEN = 8


def store_password(plain: str) -> str:
    """Convierte una contrasena en su forma persistida.

    Placeholder: hoy es texto plano. Reemplazar por hash real en produccion.
    """
    return plain


def verify_password(plain: str, stored: str) -> bool:
    if not stored:
        return False
    return plain == stored


def validar_curp(curp: str) -> tuple[bool, str]:
    """Valida estructura completa de CURP. Devuelve (es_valida, mensaje_error)."""
    if len(curp) != 18:
        return False, "La CURP debe tener exactamente 18 caracteres."
    if not CURP_REGEX.match(curp):
        return False, "El formato de la CURP no es valido."
    estado_code = curp[11:13]
    if estado_code not in CODIGOS_ESTADO_CURP:
        return False, f"Codigo de entidad '{estado_code}' no reconocido."
    mes = int(curp[6:8])
    dia = int(curp[8:10])
    if not 1 <= mes <= 12:
        return False, "Mes de nacimiento invalido en la CURP."
    if not 1 <= dia <= 31:
        return False, "Dia de nacimiento invalido en la CURP."
    return True, ""


def rol_canonico(raw) -> str:
    """Normaliza un rol al canonico (admin | usuario)."""
    if raw is None:
        return "usuario"
    s = str(raw).strip().lower()
    if not s:
        return "usuario"
    if s in {"administrador", "administradora", "admin", "administrator"}:
        return "admin"
    return s
