"""
models.py — Modelos Pydantic para la API.
"""

from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class MonthEntry(BaseModel):
    month: str           # "Enero", "Febrero", …
    month_index: int     # 0-11
    amount: float
    tipo: str            # "facturado" | "proyeccion" | "sin_color"


class RowRecord(BaseModel):
    row_number: int
    cliente: str
    descripcion: str
    cc: str
    gerente: str
    cotizacion: float
    meses: list[MonthEntry]
    total_facturado: float
    total_proyeccion: float
    diferencia: float
    pct_cumplimiento: float


class ClienteSummary(BaseModel):
    cliente: str
    cotizacion: float
    total_facturado: float
    total_proyeccion: float
    diferencia: float
    pct_cumplimiento: float
    gerentes: list[str]


class GerenteSummary(BaseModel):
    gerente: str
    cotizacion: float
    total_facturado: float
    total_proyeccion: float
    diferencia: float
    pct_cumplimiento: float
    num_clientes: int


class CCSummary(BaseModel):
    cc: str
    cotizacion: float
    total_facturado: float
    total_proyeccion: float
    diferencia: float
    pct_cumplimiento: float


class MonthSummary(BaseModel):
    month: str
    month_index: int
    facturado: float
    proyeccion: float
    total: float


class KPIs(BaseModel):
    total_a_facturar: float     # Suma de TODOS los montos BJ-BU del año 2026
    total_facturado: float      # Celdas con fuente verde
    total_proyeccion: float     # Celdas con fuente azul
    sin_asignar: float          # Sin color = total_a_facturar - facturado - proyeccion
    pct_cumplimiento: float     # facturado / total_a_facturar × 100
    num_clientes: int
    num_gerentes: int
    num_registros: int
    source_file: str
    last_updated: str
    # Mantenidos por compatibilidad (no se muestran en UI)
    total_cotizacion: float = 0.0
    diferencia: float = 0.0


class DashboardData(BaseModel):
    kpis: KPIs
    rows: list[RowRecord]
    by_cliente: list[ClienteSummary]
    by_gerente: list[GerenteSummary]
    by_cc: list[CCSummary]
    by_month: list[MonthSummary]


class HealthResponse(BaseModel):
    status: str
    source_file: Optional[str]
    last_updated: Optional[str]
    watch_interval_sec: int
