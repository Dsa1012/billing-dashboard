"""
publicar.py - Compila el frontend y expone el dashboard publicamente
usando Cloudflare Tunnel (gratis, sin cuenta, URL instantanea).

Pasos:
  1. Compila el frontend React (npm run build)
  2. Descarga cloudflared.exe si no existe
  3. Inicia el backend FastAPI en puerto 8000
  4. Lanza el tunnel y muestra la URL publica
"""
import sys
import subprocess
import time
import urllib.request
import threading
import re
from pathlib import Path

ROOT    = Path(__file__).resolve().parent.parent
BACK    = ROOT / "backend"
FRONT   = ROOT / "frontend"
VENV    = BACK / "venv"
PY_EXE  = VENV / "Scripts" / "python.exe"
CF_EXE  = ROOT / "scripts" / "cloudflared.exe"

SEP = "=" * 60

def banner(msg):
    print()
    print(SEP)
    print(f"  {msg}")
    print(SEP)

# ── Verificaciones previas ──────────────────────────────────────
banner("BILLING DASHBOARD - Publicar en internet")

if not PY_EXE.exists():
    print("  ERROR: Entorno virtual no encontrado.")
    print("  Ejecuta primero: scripts\\install.bat")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

if not (FRONT / "node_modules").exists():
    print("  ERROR: Frontend no instalado.")
    print("  Ejecuta primero: scripts\\install.bat")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

# ── Paso 1: Compilar frontend ───────────────────────────────────
print()
print("[1/3] Compilando frontend (npm run build)...")
print("  Esto puede tardar 30-60 segundos...")
result = subprocess.run(
    "npm run build",
    cwd=str(FRONT),
    shell=True,
)
if result.returncode != 0:
    print("  ERROR: Fallo la compilacion del frontend.")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)
print("  [OK] Frontend compilado en frontend/dist/")

# ── Paso 2: Descargar cloudflared si no existe ─────────────────
print()
print("[2/3] Verificando cloudflared...")
if not CF_EXE.exists():
    print("  Descargando cloudflared.exe (~30 MB)...")
    url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try:
        urllib.request.urlretrieve(url, str(CF_EXE))
        print("  [OK] cloudflared descargado.")
    except Exception as e:
        print(f"  ERROR al descargar cloudflared: {e}")
        print("  Descargalo manualmente desde: https://github.com/cloudflare/cloudflared/releases")
        print("  Guardalo como: scripts\\cloudflared.exe")
        input("\n  Presiona Enter para salir...")
        sys.exit(1)
else:
    print("  [OK] cloudflared ya existe.")

# ── Paso 3: Iniciar backend + tunnel ───────────────────────────
print()
print("[3/3] Iniciando backend y tunnel...")

# Backend en nueva ventana
backend_proc = subprocess.Popen(
    [str(PY_EXE), "-m", "uvicorn",
     "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    creationflags=subprocess.CREATE_NEW_CONSOLE,
    cwd=str(BACK),
)
print("  Backend iniciado (puerto 8000)...")
time.sleep(4)

# Tunnel - capturar URL del output
tunnel_url = []
tunnel_ready = threading.Event()

def run_tunnel():
    proc = subprocess.Popen(
        [str(CF_EXE), "tunnel", "--url", "http://localhost:8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    for line in proc.stdout:
        line = line.strip()
        if line:
            # Buscar la URL publica en el output de cloudflared
            match = re.search(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com', line)
            if match and not tunnel_url:
                tunnel_url.append(match.group(0))
                tunnel_ready.set()
    proc.wait()

t = threading.Thread(target=run_tunnel, daemon=True)
t.start()

print("  Esperando URL del tunnel (hasta 30s)...")
tunnel_ready.wait(timeout=30)

if tunnel_url:
    url = tunnel_url[0]
    print()
    print("=" * 60)
    print()
    print("  Dashboard disponible en:")
    print()
    print(f"  >>> {url} <<<")
    print()
    print("  Comparte ese enlace. Funciona desde celular y PC.")
    print("  La URL cambia cada vez que reinicies este script.")
    print()
    print("  Para detener: cierra esta ventana y la del backend.")
    print()
    print("=" * 60)
else:
    print()
    print("  No se pudo obtener la URL del tunnel.")
    print("  Revisa la ventana de cloudflared para ver la URL manualmente.")

print()
input("  Presiona Enter para detener el tunnel y cerrar...")
backend_proc.terminate()
