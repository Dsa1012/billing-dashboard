# Billing Dashboard 2026

Dashboard ejecutivo moderno para seguimiento de **facturación y proyección de ventas** basado en Excel.  
Detecta automáticamente el archivo más reciente en tu carpeta OneDrive/SharePoint y se actualiza en tiempo real.

---

## Arquitectura

```
billing-dashboard/
├── backend/                  ← Python FastAPI
│   ├── app/
│   │   ├── main.py           ← API REST + WebSocket
│   │   ├── excel_reader.py   ← Lectura de Excel + colores (openpyxl)
│   │   ├── watcher.py        ← File watcher + DataStore singleton
│   │   ├── models.py         ← Modelos Pydantic
│   │   └── config.py         ← Configuración central (.env)
│   ├── requirements.txt
│   └── .env                  ← Tu configuración (no commitear)
│
├── frontend/                 ← React + Tailwind + Recharts
│   ├── src/
│   │   ├── App.jsx           ← Router de vistas
│   │   ├── hooks/useData.js  ← REST + WebSocket hook
│   │   └── components/
│   │       ├── Sidebar.jsx
│   │       ├── KPICards.jsx
│   │       ├── Charts.jsx
│   │       ├── Table.jsx
│   │       ├── Filters.jsx
│   │       └── Rankings.jsx
│   └── package.json
│
└── scripts/
    ├── install.bat           ← Instala todo (una sola vez)
    └── start.bat             ← Inicia backend + frontend
```

---

## Requisitos

| Herramienta | Versión mínima | Descarga |
|-------------|----------------|----------|
| Python      | 3.10+          | https://python.org |
| Node.js     | 18+            | https://nodejs.org |

---

## Instalación (primera vez)

1. **Descarga o clona** esta carpeta en tu PC.

2. **Ejecuta el instalador:**
   ```
   scripts\install.bat
   ```
   Esto crea el entorno virtual Python, instala pip y npm.

3. **Configura tu carpeta Excel** en `backend\.env`:
   ```env
   EXCEL_FOLDER=C:/Users/user/OneDrive - actsa.net/00 Control de Gestión/Pipeline/2026
   ```

---

## Uso diario

```
scripts\start.bat
```

Abre automáticamente:
- **API backend**: http://localhost:8000
- **Dashboard**: http://localhost:5173
- **Swagger docs**: http://localhost:8000/docs

---

## Configuración del Excel

Edita `backend\.env` para ajustar la estructura de tu archivo:

```env
# Fila de inicio de datos (base-0, fila 4 en Excel → índice 3)
DATA_START_ROW=3

# Columna BJ en Excel = índice 61 en base-0
YEAR_START_COL=61

# Columna BU en Excel = índice 74 en base-0
YEAR_END_COL=74

# Tolerancia de color RGB (mayor = más permisivo)
COLOR_TOLERANCE=30

# Intervalo de polling en segundos
WATCH_INTERVAL=15
```

### Cómo calcular el índice de columna

| Columna Excel | Índice base-0 |
|---------------|---------------|
| A             | 0             |
| E             | 4             |
| BJ            | 61            |
| BU            | 74            |

Fórmula: `(letra1 - A) * 26 + (letra2 - A)` → BJ = 1×26 + 9 = 35... usar `=COLUMN(BJ1)-1` en Excel para obtener el índice base-0.

---

## Lógica de colores

El sistema lee el **color de fondo real** de cada celda con `openpyxl`:

| Color de celda | Clasificación  | Indicador |
|----------------|----------------|-----------|
| 🟢 Verde        | **Facturado**  | badge verde |
| 🔵 Azul         | **Proyección** | badge azul  |
| Sin color       | Sin asignar    | badge gris  |

Si tu Excel usa tonos de verde/azul distintos, agrega el hex en `backend/app/config.py`:
```python
GREEN_COLORS = ["00B050", "TU_HEX_AQUI", ...]
BLUE_COLORS  = ["4472C4", "TU_HEX_AQUI", ...]
```

Puedes obtener el hex de un color en Excel con una macro VBA:
```vba
Sub GetColor()
  MsgBox Hex(ActiveCell.Interior.Color)
End Sub
```

---

## API Reference

| Método | Endpoint          | Descripción                          |
|--------|-------------------|--------------------------------------|
| GET    | `/api/health`     | Estado del servidor                  |
| GET    | `/api/dashboard`  | Todos los datos consolidados         |
| GET    | `/api/kpis`       | Solo KPIs globales                   |
| GET    | `/api/clientes`   | Resumen por cliente (con filtros)    |
| GET    | `/api/gerentes`   | Resumen por gerente                  |
| GET    | `/api/cc`         | Resumen por centro de costos         |
| GET    | `/api/mensual`    | Evolución mensual                    |
| GET    | `/api/rows`       | Filas crudas (paginación + filtros)  |
| POST   | `/api/reload`     | Fuerza recarga manual del Excel      |
| WS     | `/ws`             | WebSocket — push de actualizaciones  |

Documentación interactiva: http://localhost:8000/docs

---

## Actualización automática

1. El backend hace **polling** cada `WATCH_INTERVAL` segundos (default: 15s).
2. Si el archivo cambió (nuevo mtime), recarga los datos en memoria.
3. Notifica a todos los clientes WebSocket conectados.
4. El frontend React escucha el WS y refresca sin recargar la página.

---

## Exportación

Desde la vista **Detalle de Registros**:
- **Excel (.xlsx)** → incluye todos los campos + meses
- **PDF (.pdf)** → tabla formateada con autoTable

---

## Deploy en servidor / nube

### Opción 1: Windows Server local
1. Instala Python y Node.
2. Usa `NSSM` para registrar uvicorn como servicio de Windows.
3. Sirve el frontend compilado con nginx o IIS.

```bash
# Compilar frontend para producción
cd frontend && npm run build
# Sirve la carpeta dist/ con cualquier servidor web
```

### Opción 2: Azure App Service
1. Despliega el backend FastAPI como App Service (Python 3.12).
2. Sirve el frontend desde Azure Static Web Apps.
3. Usa Azure File Share para montar la carpeta del Excel.

### Opción 3: Docker (local o cloud)
```dockerfile
# Ejemplo básico — backend
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Soporte multi-año

Para agregar 2027 u otro año, añade en `config.py`:
```python
YEAR_CONFIGS = {
  2026: {"start_col": 61, "end_col": 74},
  2027: {"start_col": 75, "end_col": 86},  # ajustar según Excel
}
```
Y extiende `excel_reader.py` para iterar `YEAR_CONFIGS`.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "No se encontró archivo Excel" | Verifica `EXCEL_FOLDER` en `.env` |
| Colores no detectados | Agrega el hex en `GREEN_COLORS`/`BLUE_COLORS` en config.py |
| Error CORS | Agrega `http://tu-servidor` a `CORS_ORIGINS` en `.env` |
| Puerto ocupado | Cambia `API_PORT` o el puerto de Vite |
| Excel bloqueado por Office | Cierra el archivo en Excel antes del reload |
