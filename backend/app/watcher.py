"""
watcher.py — Monitorea la carpeta y recarga datos cuando el archivo cambia.

Estrategia: polling simple cada WATCH_INTERVAL segundos.
Compara el mtime del archivo más reciente. Si cambia, recarga los datos
y notifica a los clientes WebSocket conectados.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.config import EXCEL_FOLDER, WATCH_INTERVAL, CLOUD_MODE
from app.excel_reader import find_latest_excel, read_excel_data, download_from_supabase, get_supabase_etag
from app.models import DashboardData

logger = logging.getLogger(__name__)


class DataStore:
    """
    Singleton que mantiene el último DashboardData en memoria
    y gestiona los clientes WebSocket suscritos.
    """

    def __init__(self):
        self._data: Optional[DashboardData] = None
        self._last_file: Optional[Path] = None
        self._last_mtime: Optional[float] = None
        self._last_load: Optional[str] = None
        self._websocket_clients: set = set()
        self._load_error: Optional[str] = None

    # ── Datos ──────────────────────────────────────────────
    @property
    def data(self) -> Optional[DashboardData]:
        return self._data

    @property
    def last_file(self) -> Optional[Path]:
        return self._last_file

    @property
    def last_load(self) -> Optional[str]:
        return self._last_load

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def force_reload(self) -> bool:
        """Recarga forzada. Retorna True si tuvo éxito."""
        if CLOUD_MODE:
            return self._load_from_cloud()
        file = find_latest_excel(EXCEL_FOLDER)
        if file is None:
            self._load_error = "No se encontró archivo Excel en la carpeta."
            logger.warning(self._load_error)
            return False
        return self._load_file(file)

    def _load_from_cloud(self) -> bool:
        """Descarga el Excel desde Supabase y recarga los datos."""
        tmp_path = download_from_supabase()
        if tmp_path is None:
            self._load_error = "No se pudo descargar el archivo desde Supabase."
            return False
        try:
            self._data = read_excel_data(tmp_path)
            self._last_file = tmp_path
            self._last_mtime = tmp_path.stat().st_mtime
            self._last_load = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._load_error = None
            logger.info("Datos cargados desde Supabase OK")
            return True
        except Exception as exc:
            self._load_error = str(exc)
            logger.error("Error al procesar el Excel de Supabase: %s", exc, exc_info=True)
            return False
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass

    def _load_file(self, file: Path) -> bool:
        try:
            self._data = read_excel_data(file)
            self._last_file = file
            self._last_mtime = file.stat().st_mtime
            self._last_load = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._load_error = None
            logger.info("Datos cargados correctamente desde: %s", file.name)
            return True
        except Exception as exc:
            self._load_error = str(exc)
            logger.error("Error al leer el archivo Excel: %s", exc, exc_info=True)
            return False

    # ── WebSocket ──────────────────────────────────────────
    def register_ws(self, ws) -> None:
        self._websocket_clients.add(ws)
        logger.debug("WS conectado. Total clientes: %d", len(self._websocket_clients))

    def unregister_ws(self, ws) -> None:
        self._websocket_clients.discard(ws)
        logger.debug("WS desconectado. Total clientes: %d", len(self._websocket_clients))

    async def broadcast(self, message: str) -> None:
        dead = set()
        for ws in self._websocket_clients:
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._websocket_clients.discard(ws)

    # ── Loop de polling ────────────────────────────────────
    async def watch_loop(self) -> None:
        """
        Tarea asyncio que verifica periódicamente si el archivo cambió.
        En modo nube compara el ETag de Supabase.
        En modo local compara el mtime del archivo.
        """
        mode = "NUBE (Supabase)" if CLOUD_MODE else f"LOCAL ({EXCEL_FOLDER})"
        logger.info("Iniciando watcher — modo: %s — intervalo: %ds", mode, WATCH_INTERVAL)

        # Carga inicial
        self.force_reload()

        last_etag: Optional[str] = None

        while True:
            await asyncio.sleep(WATCH_INTERVAL)
            try:
                if CLOUD_MODE:
                    # Modo nube: verificar ETag antes de descargar
                    etag = get_supabase_etag()
                    if etag and etag != last_etag:
                        logger.info("Archivo actualizado en Supabase — recargando…")
                        success = self._load_from_cloud()
                        if success:
                            last_etag = etag
                            await self.broadcast('{"event":"data_updated"}')
                else:
                    # Modo local: comparar mtime
                    file = find_latest_excel(EXCEL_FOLDER)
                    if file is None:
                        continue
                    mtime = file.stat().st_mtime
                    changed = (
                        self._last_file is None
                        or file != self._last_file
                        or mtime != self._last_mtime
                    )
                    if changed:
                        logger.info("Cambio detectado en: %s — recargando…", file.name)
                        success = self._load_file(file)
                        if success:
                            await self.broadcast('{"event":"data_updated"}')
            except Exception as exc:
                logger.error("Error en watch_loop: %s", exc, exc_info=True)


# Instancia global compartida
store = DataStore()
