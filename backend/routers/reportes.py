"""Endpoints de reportes geograficos y agregados."""
from fastapi import APIRouter, Depends, Query
from core.database import get_db
from services import reporte_service

router = APIRouter(prefix="/reportes", tags=["reportes"])


@router.get(
    "/cobertura/estado",
    summary="Cobertura agregada por estado",
)
def cobertura_estado(db = Depends(get_db)):
    return reporte_service.cobertura_por_estado(db)


@router.get(
    "/cobertura/unidad",
    summary="Cobertura por unidad medica (incluye lat/lng)",
)
def cobertura_unidad(db = Depends(get_db)):
    return reporte_service.cobertura_por_unidad(db)


@router.get(
    "/cobertura/grupo",
    summary="Cobertura por grupo prioritario",
)
def cobertura_grupo(db = Depends(get_db)):
    return reporte_service.cobertura_por_grupo(db)


@router.get(
    "/vacunas-por-mes",
    summary="Serie temporal de dosis aplicadas",
    description="Devuelve el conteo agrupado por mes (`YYYY-MM`) de los ultimos N meses.",
)
def vacunas_por_mes(meses: int = Query(12, ge=1, le=36), db = Depends(get_db)):
    return reporte_service.vacunas_por_mes(db, meses)


@router.get(
    "/cobertura/vacuna",
    summary="Porcentaje de cobertura por vacuna del catalogo",
)
def cobertura_vacuna(db = Depends(get_db)):
    return reporte_service.cobertura_global_por_vacuna(db)


@router.get(
    "/call-recall",
    summary="Candidatos a campania call & recall",
    description="Usuarios cuya ultima dosis fue hace mas de N dias y aun no completan su esquema.",
)
def call_recall(
    dias: int = Query(30, ge=1, le=365),
    db = Depends(get_db),
):
    return reporte_service.candidatos_call_recall(db, dias)
