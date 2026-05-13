"""Funciones de seguridad: passwords (bcrypt) y validacion CURP."""
import re
import bcrypt

CURP_REGEX = re.compile(r"^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$")
BCRYPT_PREFIX = ("$2a$", "$2b$", "$2y$")

CODIGOS_ESTADO_CURP: frozenset[str] = frozenset({
    "AS", "BC", "BS", "CC", "CS", "CH", "CL", "CM", "DF", "DG",
    "GT", "GR", "HG", "JC", "MC", "MN", "MS", "MO", "NT", "NL",
    "OC", "PL", "QT", "QR", "SP", "SL", "SR", "TC", "TS", "TL",
    "VZ", "YN", "ZS", "NE",
})

PASSWORD_MIN_LEN = 8


def store_password(plain: str) -> str:
    """Hashea una contrasena con bcrypt (cost factor 12)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, stored: str) -> bool:
    """Verifica una contrasena.

    Soporta hash bcrypt y, por compatibilidad con datos previos a la
    migracion, contrasenas en texto plano (auto-detectadas).
    """
    if not stored:
        return False
    if stored.startswith(BCRYPT_PREFIX):
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), stored.encode("utf-8"))
        except (ValueError, TypeError):
            return False
    return plain == stored


def needs_rehash(stored: str) -> bool:
    """Indica si una contrasena guardada deberia re-hashearse."""
    return bool(stored) and not stored.startswith(BCRYPT_PREFIX)


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
    """Normaliza un rol al canonico (admin | medico | usuario)."""
    if raw is None:
        return "usuario"
    s = str(raw).strip().lower()
    if not s:
        return "usuario"
    if s in {"administrador", "administradora", "admin", "administrator"}:
        return "admin"
    if s in {"medico", "medica", "doctor", "doctora", "md"}:
        return "medico"
    return s


# Roles que requieren autenticacion completa (CURP + password obligatorio).
ROLES_PRIVILEGIADOS = frozenset({"admin", "medico"})


def es_rol_privilegiado(rol: str) -> bool:
    """True si el rol exige login con contrasena obligatoria."""
    return rol_canonico(rol) in ROLES_PRIVILEGIADOS
