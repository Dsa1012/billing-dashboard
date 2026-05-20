"""
start_backend_only.py - Inicia solo el backend FastAPI.
Util para desarrollo o cuando el frontend ya esta corriendo.
"""
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACK = ROOT / "backend"
VENV = BACK / "venv"
UV   = VENV / "Scripts" / "uvicorn.exe"

print()
print("=" * 60)
print("  BILLING DASHBOARD - Solo Backend")
print("=" * 60)
print()

if not (VENV / "Scripts" / "python.exe").exists():
    print("  ERROR: Entorno virtual no encontrado.")
    print("  Ejecuta primero: scripts\\install.bat")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

print(f"  Backend API  ->  http://localhost:8000")
print(f"  Docs API     ->  http://localhost:8000/docs")
print()
print("  Iniciando uvicorn... (Ctrl+C para detener)")
print()

# Ejecutar uvicorn en el mismo proceso (sin nueva ventana)
# cwd=str(BACK) fija el directorio de trabajo sin "cd /d"
subprocess.run(
    [str(UV), "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=str(BACK)
)
