"""Endpoints de salud.

- `/health` (liveness): no toca la BD. Lo usa el orquestador (Coolify, k8s) para
  saber si el proceso esta vivo. Devuelve 200 mientras FastAPI responda.
- `/health/db` (readiness): hace un `SELECT 1` contra la BD. Util para
  diagnostico manual o un readiness probe separado. Devuelve 503 si la BD falla.
"""
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/health/db")
def health_db(db = Depends(get_db)):
    try:
        with db.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
