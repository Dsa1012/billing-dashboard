# ── Etapa 1: compilar el frontend React ──────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Etapa 2: backend Python con frontend compilado ───────────
FROM python:3.11-slim
WORKDIR /app

# Instalar dependencias Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ ./backend/

# Copiar frontend compilado al lugar donde main.py lo espera
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Directorio de trabajo para uvicorn
WORKDIR /app/backend

# Railway inyecta $PORT automáticamente
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
