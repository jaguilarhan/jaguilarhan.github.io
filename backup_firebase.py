"""
BACKUP COMPLETO DE FIREBASE - workea.me
Descarga todo el nodo obra_data y lo guarda como JSON local.
Ejecutar: python backup_firebase.py
"""
import urllib.request, json, ssl, os
from datetime import datetime

# Configuración
FIREBASE_URL = "https://proyect3082-default-rtdb.firebaseio.com"
NODO_RAIZ = "obra_data"
BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")

def descargar_nodo(ruta):
    """Descarga un nodo completo de Firebase"""
    ctx = ssl.create_default_context()
    url = f"{FIREBASE_URL}/{ruta}.json"
    print(f"📥 Descargando: {url}")
    req = urllib.request.Request(url)
    resp = urllib.request.urlopen(req, context=ctx, timeout=30)
    data = json.loads(resp.read().decode("utf-8"))
    return data

def main():
    print("=" * 60)
    print("🔒 BACKUP DE FIREBASE - workea.me")
    print("=" * 60)

    # Crear carpeta de backups si no existe
    os.makedirs(BACKUP_DIR, exist_ok=True)

    # Descargar TODO el nodo obra_data
    print(f"\n📦 Descargando nodo raíz: {NODO_RAIZ}...")
    data = descargar_nodo(NODO_RAIZ)

    if data is None:
        print("❌ No se encontraron datos en Firebase")
        return

    # Mostrar resumen de lo descargado
    print(f"\n📋 Contenido descargado:")
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, list):
                items = [v for v in value if v is not None]
                print(f"   📁 {key}: {len(items)} registros")
            elif isinstance(value, dict):
                print(f"   📁 {key}: {len(value)} entradas")
            else:
                print(f"   📄 {key}: {type(value).__name__}")
    elif isinstance(data, list):
        items = [v for v in data if v is not None]
        print(f"   📁 {NODO_RAIZ}: {len(items)} registros")

    # Guardar con timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"backup_{timestamp}.json"
    filepath = os.path.join(BACKUP_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Tamaño del archivo
    size_bytes = os.path.getsize(filepath)
    if size_bytes > 1024 * 1024:
        size_str = f"{size_bytes / (1024*1024):.2f} MB"
    elif size_bytes > 1024:
        size_str = f"{size_bytes / 1024:.2f} KB"
    else:
        size_str = f"{size_bytes} bytes"

    print(f"\n✅ Backup guardado exitosamente!")
    print(f"   📄 Archivo: {filepath}")
    print(f"   📏 Tamaño: {size_str}")
    print(f"   🕐 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # También guardar una copia con nombre fijo (último backup)
    latest_path = os.path.join(BACKUP_DIR, "backup_ULTIMO.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"   📄 Copia última: {latest_path}")

    print(f"\n{'=' * 60}")
    print(f"💡 Para restaurar, ejecuta: python restaurar_firebase.py")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()

