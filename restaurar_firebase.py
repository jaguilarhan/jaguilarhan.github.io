"""
RESTAURAR BACKUP DE FIREBASE - workea.me
Sube un archivo de backup JSON de vuelta a Firebase.
Ejecutar: python restaurar_firebase.py
"""
import urllib.request, json, ssl, os, sys, glob
from datetime import datetime

# Configuración
FIREBASE_URL = "https://proyect3082-default-rtdb.firebaseio.com"
NODO_RAIZ = "obra_data"
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")

def listar_backups():
    """Lista los backups disponibles"""
    patron = os.path.join(BACKUP_DIR, "backup_202*.json")
    archivos = sorted(glob.glob(patron), reverse=True)
    return archivos

def restaurar(filepath):
    """Restaura un backup a Firebase"""
    ctx = ssl.create_default_context()

    print(f"\n📂 Leyendo backup: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    url = f"{FIREBASE_URL}/{NODO_RAIZ}.json"
    payload = json.dumps(data).encode("utf-8")

    print(f"📤 Subiendo a Firebase: {url}")
    print(f"   📏 Tamaño: {len(payload) / 1024:.2f} KB")

    req = urllib.request.Request(url, data=payload, method="PUT")
    req.add_header("Content-Type", "application/json")
    resp = urllib.request.urlopen(req, context=ctx, timeout=60)

    if resp.status == 200:
        print(f"\n✅ Restauración exitosa! (status: {resp.status})")
    else:
        print(f"\n⚠️ Respuesta inesperada (status: {resp.status})")

def main():
    print("=" * 60)
    print("🔄 RESTAURAR BACKUP DE FIREBASE - workea.me")
    print("=" * 60)

    if not os.path.exists(BACKUP_DIR):
        print("❌ No existe la carpeta de backups")
        return

    backups = listar_backups()

    if not backups:
        print("❌ No hay backups disponibles")
        return

    print(f"\n📋 Backups disponibles ({len(backups)}):\n")
    for i, bk in enumerate(backups):
        nombre = os.path.basename(bk)
        size = os.path.getsize(bk)
        size_str = f"{size / 1024:.1f} KB" if size < 1024*1024 else f"{size/(1024*1024):.2f} MB"
        print(f"   [{i+1}] {nombre} ({size_str})")

    print(f"\n   [0] Cancelar")

    try:
        opcion = input("\n🔢 Selecciona el backup a restaurar: ").strip()
        idx = int(opcion)

        if idx == 0:
            print("❌ Cancelado")
            return

        if idx < 1 or idx > len(backups):
            print("❌ Opción inválida")
            return

        archivo = backups[idx - 1]

        print(f"\n⚠️  ¿Estás seguro de restaurar {os.path.basename(archivo)}?")
        print(f"   Esto REEMPLAZARÁ todos los datos actuales en Firebase.")
        confirmar = input("   Escribe 'SI' para confirmar: ").strip()

        if confirmar.upper() != "SI":
            print("❌ Cancelado")
            return

        restaurar(archivo)

    except ValueError:
        print("❌ Entrada inválida")
    except KeyboardInterrupt:
        print("\n❌ Cancelado")

if __name__ == "__main__":
    main()

