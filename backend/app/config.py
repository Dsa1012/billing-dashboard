"""
config.py — Configuración central de la aplicación.
Edita las variables de entorno en ../.env o directamente aquí.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ──────────────────────────────────────────────
# CARPETA EXCEL
# ──────────────────────────────────────────────
# Ruta a la carpeta sincronizada con OneDrive / SharePoint.
# En Windows usa barras normales: C:/Users/...
EXCEL_FOLDER: str = os.getenv(
    "EXCEL_FOLDER",
    r"C:\Users\user\OneDrive - actsa.net\00 Control de Gestión\Pipeline\2026",
)

# Extensiones válidas
EXCEL_EXTENSIONS: list[str] = [".xlsx", ".xlsm", ".xls"]

# ──────────────────────────────────────────────
# ESTRUCTURA DEL EXCEL 2026
# ──────────────────────────────────────────────
# Fila de inicio de datos (base-0 para pandas, 0 = fila 1 en Excel)
DATA_START_ROW: int = int(os.getenv("DATA_START_ROW", 3))   # fila 4 en Excel → índice 3

# Columnas de metadatos (base-0)
COL_CLIENTE:       int = 0   # A
COL_DESCRIPCION:   int = 1   # B
COL_CC:            int = 2   # C
COL_GERENTE:       int = 3   # D
COL_COTIZACION:    int = 4   # E

# Columnas mensuales 2026  (BJ=62 … BU=75, base-1 en Excel → base-0 en pandas: 61…74)
YEAR_START_COL: int = int(os.getenv("YEAR_START_COL", 61))   # BJ (base-0)
YEAR_END_COL:   int = int(os.getenv("YEAR_END_COL",   74))   # BU (base-0, inclusive)

MONTH_NAMES: list[str] = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

# ──────────────────────────────────────────────
# COLORES DE FUENTE (font color, no background)
# ──────────────────────────────────────────────
# IMPORTANTE: Este Excel usa color de FUENTE (letra), no de fondo (fill).
# Verificado leyendo el XML del archivo Pipeline Facturación 202605.xlsx.
#
# Verde  → Facturado   → font rgb FF00B050  (#00B050)
# Azul   → Proyección  → font rgb FF0000CC  (#0000CC)
# Rojo   → Alerta      → font rgb FFFF0000  (#FF0000)  [clasificado como sin_color]
#
# Agrega variantes si el archivo usa tonos ligeramente distintos.
GREEN_FONT_COLORS: list[str] = [
    "00B050",          # verde estándar del Excel — confirmado en el archivo real
    "70AD47",          # verde Office alternativo
    "008000",          # verde oscuro
    "00B04F",          # variante menor
]

BLUE_FONT_COLORS: list[str] = [
    "0000CC",          # azul confirmado en el archivo real
    "0000FF",          # azul puro
    "0070C0",          # azul Office estándar
    "4472C4",          # azul accent Office
    "2F75B6",          # azul oscuro Office
    "0563C1",          # azul hipervínculo Office
]

# Tolerancia de diferencia por canal RGB (0–255)
COLOR_TOLERANCE: int = int(os.getenv("COLOR_TOLERANCE", 25))

# Compatibilidad con versión anterior (colores de fondo, no usados en este Excel)
GREEN_COLORS = GREEN_FONT_COLORS   # alias compatibilidad
BLUE_COLORS  = BLUE_FONT_COLORS    # alias compatibilidad

# ──────────────────────────────────────────────
# SERVIDOR
# ──────────────────────────────────────────────
API_HOST:  str = os.getenv("API_HOST", "0.0.0.0")
API_PORT:  int = int(os.getenv("API_PORT", 8000))
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")

# Intervalo de polling de cambios en el archivo (segundos)
WATCH_INTERVAL: int = int(os.getenv("WATCH_INTERVAL", 60))

# ──────────────────────────────────────────────
# MODO NUBE — Supabase Storage
# Si estas variables están definidas, el backend descarga el Excel
# desde Supabase en vez de leerlo desde disco local.
# ──────────────────────────────────────────────
SUPABASE_URL:    str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY:    str = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET: str = os.getenv("SUPABASE_BUCKET", "dashboard-data")
SUPABASE_FILE:   str = os.getenv("SUPABASE_FILE", "pipeline.xlsx")

# True si el modo nube está activo
CLOUD_MODE: bool = bool(SUPABASE_URL and SUPABASE_KEY)
