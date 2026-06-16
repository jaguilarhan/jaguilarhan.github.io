import urllib.request
import json

# Verificar el estado actual
url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
r = urllib.request.urlopen(url, timeout=60)
raw = r.read().decode('utf-8')

with open('_verify_result.txt', 'w', encoding='utf-8') as f:
    f.write(f"Ocurrencias 03.01.01.02: {raw.count('03.01.01.02')}\n")
    f.write(f"Ocurrencias 03.01.01.01: {raw.count('03.01.01.01')}\n")
    f.write(f"Ocurrencias SOGA: {raw.count('SOGA')}\n")
    f.write(f"Ocurrencias CABEZA: {raw.count('CABEZA')}\n")

    data = json.loads(raw)
    # Mostrar un ejemplo de actividad cambiada
    if 'actividades' in data:
        acts = data['actividades']
        for i in [9, 13, 14]:
            if i < len(acts) and acts[i]:
                a = acts[i]
                f.write(f"\nActividad [{i}]:\n")
                f.write(f"  codigo: {a.get('partida',{}).get('codigo','N/A')}\n")
                f.write(f"  nombre: {a.get('partida',{}).get('nombre','N/A')}\n")
                f.write(f"  descripcion: {a.get('descripcion','N/A')}\n")

