"""Conexion a base de datos MySQL.

Cada request crea su propia conexion via dependencia FastAPI.
"""
import pymysql
import pymysql.cursors
from fastapi import HTTPException
from .config import settings


def get_db():
    """Dependency: abre conexion y la cierra al finalizar el request."""
    try:
        conn = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
    except pymysql.Error as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Error de conexion a la base de datos: {exc}",
        ) from exc

    try:
        yield conn
    finally:
        conn.close()
