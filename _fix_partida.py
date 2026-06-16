import urllib.request
import json
import sys

# Descargar toda la data de obra_data
print("Descargando datos de Firebase...")
url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
r = urllib.request.urlopen(url)
raw = r.read().decode('utf-8')
data = json.loads(raw)

# Guardar backup primero
backup_path = 'C:/Users/Jose Alonso/IntelliJ_IDEA/work_manage_app/_backup_before_partida_fix.json'
with open(backup_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f"Backup guardado en: {backup_path}")

# Textos a buscar y reemplazar
OLD_PARTIDA_NUM = '03.01.01.02'
NEW_PARTIDA_NUM = '03.01.01.01'
OLD_TEXT = 'MURO DE LADRILLO K.K TIPO V DE SOGA C/MEZCLA 1:5'
NEW_TEXT = 'MURO DE LADRILLO K.K TIPO V DE CABEZA C/MEZCLA 1:5'
# Tambien variante con punto y espacio diferente
OLD_FULL = '03.01.01.02 MURO DE LADRILLO K.K TIPO V DE SOGA C/MEZCLA 1:5'
NEW_FULL = '03.01.01.01 MURO DE LADRILLO K.K TIPO V DE CABEZA C/MEZCLA 1:5'

# Funcion recursiva para buscar
changes = []

def find_occurrences(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_occurrences(v, f"{path}/{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_occurrences(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        if OLD_PARTIDA_NUM in obj and 'SOGA' in obj.upper():
            changes.append((path, obj))

find_occurrences(data)

print(f"\nEncontradas {len(changes)} ocurrencias con 03.01.01.02 + SOGA:")
for path, val in changes:
    print(f"  {path}")
    print(f"    -> {val[:250]}")

# Funcion recursiva para reemplazar
def replace_in_obj(obj):
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            new_dict[k] = replace_in_obj(v)
        return new_dict
    elif isinstance(obj, list):
        return [replace_in_obj(v) for v in obj]
    elif isinstance(obj, str):
        # Reemplazar la partida completa
        result = obj.replace(OLD_FULL, NEW_FULL)
        # Si aun queda 03.01.01.02 con SOGA, reemplazar numero y texto por separado
        if OLD_PARTIDA_NUM in result and 'SOGA' in result.upper():
            result = result.replace(OLD_PARTIDA_NUM, NEW_PARTIDA_NUM)
            result = result.replace('SOGA', 'CABEZA')
            result = result.replace('soga', 'cabeza')
        return result
    else:
        return obj

if len(changes) > 0:
    print(f"\nAplicando {len(changes)} reemplazos...")
    new_data = replace_in_obj(data)

    # Verificar cambios
    new_json = json.dumps(new_data, ensure_ascii=False)
    remaining = new_json.count('03.01.01.02')
    soga_remaining = new_json.count('SOGA')
    print(f"Despues del reemplazo: {remaining} ocurrencias de 03.01.01.02 restantes")
    print(f"Despues del reemplazo: {soga_remaining} ocurrencias de SOGA restantes")

    # Subir a Firebase
    print("\nSubiendo cambios a Firebase...")
    put_data = json.dumps(new_data, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json',
        data=put_data,
        method='PUT',
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    print(f"Respuesta Firebase: {resp.status}")
    print("CAMBIOS APLICADOS EXITOSAMENTE!")
else:
    print("\nNo se encontraron ocurrencias para reemplazar.")

# Guardar resultado
with open('C:/Users/Jose Alonso/IntelliJ_IDEA/work_manage_app/_fix_partida_result.txt', 'w', encoding='utf-8') as f:
    f.write(f"Cambios aplicados: {len(changes)}\n")
    for path, val in changes:
        f.write(f"\n{path}\n  ANTES: {val[:300]}\n")

