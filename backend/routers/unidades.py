from fastapi import APIRouter, Depends
from core.database import get_db

router = APIRouter(prefix="/unidades", tags=["unidades"])


@router.get("")
def listar_unidades(db = Depends(get_db)):
    with db.cursor() as cur:
        cur.execute("SELECT * FROM unidades_medicas ORDER BY nombre")
        return cur.fetchall()
