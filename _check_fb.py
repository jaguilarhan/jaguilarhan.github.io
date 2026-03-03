import urllib.request, json, ssl
ctx = ssl.create_default_context()
url = "https://proyect3082-default-rtdb.firebaseio.com/obra_data/actividades.json"
try:
    r = urllib.request.urlopen(url, context=ctx, timeout=15)
    d = r.read().decode("utf-8")
    data = json.loads(d)
    if data is None:
        print("Firebase esta VACIO - no hay actividades")
    elif isinstance(data, list):
        reales = [a for a in data if a is not None]
        print(f"Firebase tiene: {len(reales)} actividades")
        fechas = sorted(set(a.get("fecha","?") for a in reales))
        print(f"Fechas: {fechas}")
        for a in reales:
            print(f"  {a.get('fecha','?')} | {a.get('descripcion','?')}")
    else:
        print(f"Tipo inesperado: {type(data)}")
        print(str(d)[:500])
except Exception as e:
    print(f"Error: {e}")

