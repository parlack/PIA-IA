"""Constantes compartidas del dominio."""

TIPOS_MENSAJE = ("informacion", "advertencia", "urgente", "recordatorio")

REMITENTE_SISTEMA_DEFAULT = "XEXX010101HNEXXXA4"

AEFI_VENTANA_DIAS = 30

GRUPOS_PRIORITARIOS = ("ninguno", "adulto_mayor", "embarazada", "personal_salud", "cronico")

VACUNAS_PRIORITARIAS_POR_GRUPO: dict[str, set[int]] = {
    "adulto_mayor":   {10, 13, 16},
    "embarazada":     {10, 15},
    "personal_salud": {2, 10, 14, 16},
    "cronico":        {10, 13, 16},
}

ROL_ADMIN = "admin"
ROL_USUARIO = "usuario"
