"""
main.py — Aplicación FastAPI principal.

Endpoints:
  GET  /api/health          — Estado del servidor y del archivo
  GET  /api/dashboard       — Datos completos del dashboard
  GET  /api/kpis            — Solo KPIs
  GET  /api/clientes        — Resumen por cliente
  GET  /api/gerentes        — Resumen por gerente
  GET  /api/cc              — Resumen por centro de costos
  GET  /api/mensual         — Evolución mensual
  GET  /api/rows            — Filas crudas (con filtros opcionales)
  POST /api/reload          — Fuerza recarga manual
  WS   /ws                  — WebSocket para push de actualizaciones
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from pathlib import Path as _Path
from app.config import API_HOST, API_PORT, CORS_ORIGINS, WATCH_INTERVAL

# Carpeta del frontend compilado (relativa a este archivo)
_DIST = _Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
from app.models import (
    DashboardData, HealthResponse, KPIs,
    ClienteSummary, GerenteSummary, CCSummary, MonthSummary, RowRecord,
)
from app.watcher import store

# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Lifespan (reemplaza @app.on_event deprecated)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(store.watch_loop())
    logger.info("Watcher iniciado.")
    yield
    task.cancel()
    logger.info("Watcher detenido.")


app = FastAPI(
    title="Billing Dashboard API",
    description="API para seguimiento de facturación y proyección de ventas desde Excel.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
def _require_data() -> DashboardData:
    if store.data is None:
        detail = store.load_error or "Los datos aún no están disponibles. Intenta de nuevo en unos segundos."
        raise HTTPException(status_code=503, detail=detail)
    return store.data


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse, tags=["sistema"])
def health():
    return HealthResponse(
        status="ok" if store.data else "sin_datos",
        source_file=store.last_file.name if store.last_file else None,
        last_updated=store.last_load,
        watch_interval_sec=WATCH_INTERVAL,
    )


@app.get("/api/dashboard", response_model=DashboardData, tags=["dashboard"])
def get_dashboard():
    return _require_data()


@app.get("/api/kpis", response_model=KPIs, tags=["dashboard"])
def get_kpis():
    return _require_data().kpis


@app.get("/api/clientes", response_model=list[ClienteSummary], tags=["dashboard"])
def get_clientes(
    search: Optional[str] = Query(None, description="Filtro por nombre"),
    gerente: Optional[str] = Query(None, description="Filtrar por gerente"),
    limit: int = Query(100, ge=1, le=500),
):
    data = _require_data().by_cliente
    if search:
        q = search.lower()
        data = [d for d in data if q in d.cliente.lower()]
    if gerente:
        data = [d for d in data if gerente.lower() in [g.lower() for g in d.gerentes]]
    return data[:limit]


@app.get("/api/gerentes", response_model=list[GerenteSummary], tags=["dashboard"])
def get_gerentes(search: Optional[str] = Query(None)):
    data = _require_data().by_gerente
    if search:
        q = search.lower()
        data = [d for d in data if q in d.gerente.lower()]
    return data


@app.get("/api/cc", response_model=list[CCSummary], tags=["dashboard"])
def get_cc():
    return _require_data().by_cc


@app.get("/api/mensual", response_model=list[MonthSummary], tags=["dashboard"])
def get_mensual():
    return _require_data().by_month


@app.get("/api/rows", response_model=list[RowRecord], tags=["datos"])
def get_rows(
    cliente:  Optional[str] = Query(None),
    gerente:  Optional[str] = Query(None),
    cc:       Optional[str] = Query(None),
    search:   Optional[str] = Query(None, description="Búsqueda global en cliente, descripción, CC"),
    limit:    int            = Query(200, ge=1, le=2000),
    offset:   int            = Query(0, ge=0),
):
    rows = _require_data().rows

    if cliente:
        rows = [r for r in rows if cliente.lower() in r.cliente.lower()]
    if gerente:
        rows = [r for r in rows if gerente.lower() in r.gerente.lower()]
    if cc:
        rows = [r for r in rows if cc.lower() in r.cc.lower()]
    if search:
        q = search.lower()
        rows = [
            r for r in rows
            if q in r.cliente.lower()
            or q in r.descripcion.lower()
            or q in r.cc.lower()
            or q in r.gerente.lower()
        ]

    return rows[offset : offset + limit]


@app.post("/api/reload", tags=["sistema"])
def manual_reload():
    success = store.force_reload()
    if success:
        return {"status": "ok", "message": "Datos recargados correctamente.",
                "file": store.last_file.name if store.last_file else None,
                "last_updated": store.last_load}
    raise HTTPException(status_code=500, detail=store.load_error or "Error al recargar datos.")


# ──────────────────────────────────────────────
# WEBSOCKET
# ──────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    store.register_ws(ws)
    # Enviar snapshot inicial
    try:
        if store.last_load:
            await ws.send_text(f'{{"event":"connected","last_updated":"{store.last_load}"}}')
        async for _ in ws.iter_text():
            pass   # keep-alive: ignorar mensajes del cliente
    except WebSocketDisconnect:
        pass
    finally:
        store.unregister_ws(ws)


# ──────────────────────────────────────────────
# FRONTEND ESTÁTICO (modo producción)
# Se activa solo cuando existe frontend/dist/ (generado por npm run build).
# En desarrollo se usa Vite directamente (puerto 5173).
# ──────────────────────────────────────────────
if _DIST.exists():
    # Servir assets compilados: JS, CSS, imágenes
    _assets = _DIST / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Redirige cualquier ruta desconocida a index.html (React Router)."""
        index = _DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return JSONResponse(
            {"detail": "Frontend no compilado. Ejecuta scripts\\publicar.bat primero."},
            status_code=404,
        )


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=API_HOST, port=API_PORT, reload=False)
