"""
start.py - Lanzador del Billing Dashboard.
Inicia backend y frontend en ventanas separadas.
"""
import sys
import subprocess
import os
import time
import webbrowser
from pathlib import Path

ROOT   = Path(__file__).resolve().parent.parent
BACK   = ROOT / "backend"
FRONT  = ROOT / "frontend"
VENV   = BACK  / "venv"
PY_EXE = VENV  / "Scripts" / "python.exe"

SEP = "=" * 60

print()
print(SEP)
print("  BILLING DASHBOARD - Iniciando aplicacion")
print(SEP)
print()

# Verificar que install fue ejecutado
if not PY_EXE.exists():
    print("  ERROR: Entorno virtual no encontrado.")
    print("  Ejecuta primero: scripts\\install.bat")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

if not (FRONT / "node_modules").exists():
    print("  ERROR: Dependencias frontend no instaladas.")
    print("  Ejecuta primero: scripts\\install.bat")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

print("  Backend API  ->  http://localhost:8000")
print("  Dashboard    ->  http://localhost:5173")
print("  Docs API     ->  http://localhost:8000/docs")
print()

# Iniciar backend en nueva ventana CMD.
# Usamos lista de argumentos (no string) para que Windows maneje correctamente
# rutas con espacios y caracteres especiales. python -m uvicorn evita buscar
# uvicorn.exe directamente.
subprocess.Popen(
    [str(PY_EXE), "-m", "uvicorn",
     "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    creationflags=subprocess.CREATE_NEW_CONSOLE,
    cwd=str(BACK)
)

time.sleep(3)

# Iniciar frontend en nueva ventana CMD
# shell=True necesario para que cmd encuentre npm en el PATH del usuario
subprocess.Popen(
    "npm run dev",
    creationflags=subprocess.CREATE_NEW_CONSOLE,
    cwd=str(FRONT),
    shell=True
)

time.sleep(5)
webbrowser.open("http://localhost:5173")

print("  Aplicacion iniciada en segundo plano.")
print("  Cierra las ventanas de CMD para detener.")
print()
input("  Presiona Enter para cerrar este instalador...")
