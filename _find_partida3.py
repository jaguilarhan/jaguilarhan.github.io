import urllib.request
import json

# Descargar toda la data de obra_data
url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
r = urllib.request.urlopen(url)
data = json.loads(r.read().decode('utf-8'))

# Guardar backup primero
with open('C:/Users/Jose Alonso/IntelliJ_IDEA/work_manage_app/_backup_before_partida_fix.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Funcion recursiva para buscar y reemplazar
changes = []

def find_and_replace(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_and_replace(v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_and_replace(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        if '03.01.01.02' in obj:
            changes.append(f"PATH: {path}")
            changes.append(f"  ANTES: {obj[:200]}")

find_and_replace(data)

with open('C:/Users/Jose Alonso/IntelliJ_IDEA/work_manage_app/_find_result2.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total cambios encontrados: {len(changes)//2}\n\n")
    f.write('\n'.join(changes))

