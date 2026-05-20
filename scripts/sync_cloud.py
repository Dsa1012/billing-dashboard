"""
sync_cloud.py - Sube el Excel a Supabase automaticamente cuando cambia.

Uso:
  1. Configura SUPABASE_URL, SUPABASE_KEY y SUPABASE_BUCKET en backend/.env
  2. Ejecuta este script (queda en segundo plano monitoreando el archivo)
  3. Cada vez que guardas el Excel, se sube solo a la nube

El dashboard en Railway se actualiza automaticamente al detectar el cambio.
"""
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

# Cargar config desde backend/.env
ROOT   = Path(__file__).resolve().parent.parent
BACK   = ROOT / "backend"
load_dotenv(BACK / ".env")

SUPABASE_URL    = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY    = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "dashboard-data")
SUPABASE_FILE   = os.getenv("SUPABASE_FILE", "pipeline.xlsx")
EXCEL_FOLDER    = os.getenv("EXCEL_FOLDER",
    r"C:\Users\user\OneDrive - actsa.net\00 Control de Gestión\Pipeline\2026")
CHECK_INTERVAL  = int(os.getenv("WATCH_INTERVAL", 30))

SEP = "=" * 60


def find_latest_excel(folder):
    p = Path(folder)
    if not p.exists():
        return None
    candidates = [
        f for f in p.iterdir()
        if f.is_file()
        and f.suffix.lower() in (".xlsx", ".xlsm", ".xls")
        and not f.name.startswith("~$")
    ]
    return max(candidates, key=lambda f: f.stat().st_mtime) if candidates else None


def upload_to_supabase(file_path: Path) -> bool:
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{SUPABASE_FILE}"
    with open(file_path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            ok = resp.status in (200, 201)
            if ok:
                print(f"  [OK] Subido: {file_path.name} ({len(data)/1024:.0f} KB)")
            else:
                print(f"  [ERROR] Respuesta inesperada: {resp.status}")
            return ok
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        print(f"  [ERROR] HTTP {e.code}: {body[:200]}")
        return False
    except Exception as exc:
        print(f"  [ERROR] {exc}")
        return False


# ── Verificaciones ─────────────────────────────────────────────
print()
print(SEP)
print("  BILLING DASHBOARD - Sync a la nube")
print(SEP)
print()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("  ERROR: Falta configurar SUPABASE_URL y SUPABASE_KEY en backend/.env")
    print()
    print("  Agrega estas lineas a backend/.env:")
    print("    SUPABASE_URL=https://xxxxxxxx.supabase.co")
    print("    SUPABASE_KEY=tu_anon_key_aqui")
    input("\n  Presiona Enter para salir...")
    sys.exit(1)

print(f"  Carpeta Excel : {EXCEL_FOLDER}")
print(f"  Supabase URL  : {SUPABASE_URL}")
print(f"  Bucket        : {SUPABASE_BUCKET}/{SUPABASE_FILE}")
print(f"  Intervalo     : {CHECK_INTERVAL}s")
print()
print("  Monitoreando cambios... (Ctrl+C para detener)")
print()

# ── Loop de monitoreo ─────────────────────────────────────────
last_mtime = None
last_file  = None

# Subir inmediatamente al iniciar
excel = find_latest_excel(EXCEL_FOLDER)
if excel:
    print(f"  Subida inicial: {excel.name}")
    if upload_to_supabase(excel):
        last_mtime = excel.stat().st_mtime
        last_file  = excel
else:
    print("  ADVERTENCIA: No se encontro archivo Excel en la carpeta.")

while True:
    try:
        time.sleep(CHECK_INTERVAL)
        excel = find_latest_excel(EXCEL_FOLDER)
        if excel is None:
            continue

        mtime = excel.stat().st_mtime
        if excel != last_file or mtime != last_mtime:
            ts = time.strftime("%H:%M:%S")
            print(f"  [{ts}] Cambio detectado en {excel.name} — subiendo...")
            if upload_to_supabase(excel):
                last_mtime = mtime
                last_file  = excel

    except KeyboardInterrupt:
        print()
        print("  Sync detenido.")
        break
    except Exception as exc:
        print(f"  [ERROR] {exc}")
