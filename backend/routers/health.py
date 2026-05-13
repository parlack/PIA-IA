from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db = Depends(get_db)):
    try:
        with db.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
