import urllib.request
import json

url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
r = urllib.request.urlopen(url, timeout=60)
raw = r.read().decode('utf-8')
data = json.loads(raw)

with open('_verify_final.txt', 'w', encoding='utf-8') as f:
    f.write(f"03.01.01.02: {raw.count('03.01.01.02')}\n")
    f.write(f"03.01.01.01: {raw.count('03.01.01.01')}\n")
    f.write(f"SOGA: {raw.count('SOGA')}\n")
    f.write(f"CABEZA: {raw.count('CABEZA')}\n\n")

    # Mostrar 3 actividades ejemplo
    if 'actividades' in data:
        for i in [9, 13, 14]:
            a = data['actividades'][i]
            if a:
                f.write(f"Actividad [{i}]:\n")
                f.write(f"  codigo: {a.get('partida',{}).get('codigo','?')}\n")
                f.write(f"  nombre: {a.get('partida',{}).get('nombre','?')}\n\n")

