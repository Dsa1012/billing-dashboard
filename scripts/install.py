"""
install.py - Instalador del Billing Dashboard.
Maneja correctamente rutas con caracteres especiales (acentos, espacios).
"""
import sys
import subprocess
import os
from pathlib import Path

ROOT   = Path(__file__).resolve().parent.parent
BACK   = ROOT / "backend"
FRONT  = ROOT / "frontend"
VENV   = BACK  / "venv"
PY_EXE = VENV  / "Scripts" / "python.exe"
PIP    = VENV  / "Scripts" / "pip.exe"

SEP = "=" * 60

def run(cmd, cwd=None, check=True, shell=False):
    if isinstance(cmd, list):
        print(f"  > {' '.join(str(c) for c in cmd)}")
    else:
        print(f"  > {cmd}")
    result = subprocess.run(cmd, cwd=str(cwd) if cwd else None, shell=shell)
    if check and result.returncode != 0:
        print(f"\n  ERROR: el comando fallo (codigo {result.returncode})")
        sys.exit(result.returncode)
    return result

def check_cmd(cmd):
    # shell=True usa el PATH del CMD de Windows, igual que cuando el usuario
    # escribe el comando directamente. Necesario cuando Node esta en el PATH
    # del usuario pero Python no lo hereda via subprocess directo.
    result = subprocess.run(f"{cmd} --version", capture_output=True, shell=True)
    return result.returncode == 0

print()
print(SEP)
print("  BILLING DASHBOARD - Instalacion")
print(SEP)
print()
print(f"  Directorio raiz: {ROOT}")
print()

# 1. Verificar Python
print("[1/4] Verificando Python...")
if not check_cmd("python"):
    print()
    print("  ERROR: Python no encontrado.")
    print("  Descarga desde: https://www.python.org/downloads/")
    print("  Marca 'Add Python to PATH' durante la instalacion.")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)
print("  [OK] Python detectado.")

# 2. Verificar Node.js
print()
print("[2/4] Verificando Node.js...")
if not check_cmd("node") or not check_cmd("npm"):
    print()
    print("  ERROR: Node.js no encontrado.")
    print("  Descarga Node.js 18 LTS desde: https://nodejs.org")
    print("  Instala el archivo .msi y REINICIA este CMD.")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)
print("  [OK] Node.js y npm detectados.")

# 3. Backend Python
print()
print("[3/4] Instalando backend Python...")
os.chdir(str(BACK))

if not VENV.exists():
    print("  Creando entorno virtual...")
    run([sys.executable, "-m", "venv", str(VENV)], cwd=BACK)

print("  Actualizando pip, setuptools y wheel...")
run([str(PY_EXE), "-m", "pip", "install", "--upgrade",
     "pip", "setuptools", "wheel", "--quiet"], cwd=BACK)

print("  Instalando paquetes (puede tardar unos minutos)...")
# --prefer-binary: usa wheels pre-compilados, evita compilar desde fuente
# (necesario en Miniconda donde pydantic-core/pandas requieren Rust/Meson)
run([str(PY_EXE), "-m", "pip", "install", "-r", "requirements.txt",
     "--prefer-binary"], cwd=BACK)

env_file = BACK / ".env"
if not env_file.exists():
    import shutil
    shutil.copy(str(BACK / ".env.example"), str(env_file))
    print("  [OK] .env creado desde .env.example")

print("  [OK] Backend listo.")

# 4. Frontend Node.js
print()
print("[4/4] Instalando frontend Node.js...")
run("npm install", cwd=FRONT, shell=True)
print("  [OK] Frontend listo.")

print()
print(SEP)
print("  Instalacion completada correctamente.")
print()
print("  Para iniciar la app ejecuta:")
print("    scripts\\start.bat")
print(SEP)
print()
input("  Presiona Enter para cerrar...")
