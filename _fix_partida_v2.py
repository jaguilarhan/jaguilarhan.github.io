import urllib.request
import json
import traceback

log = []

def log_msg(msg):
    log.append(msg)
    save_log()

def save_log():
    with open('_fix_log.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(log))

try:
    log_msg("INICIO - Descargando datos de Firebase...")

    url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
    r = urllib.request.urlopen(url, timeout=60)
    raw = r.read().decode('utf-8')
    data = json.loads(raw)

    log_msg(f"Datos descargados OK. Tipo: {type(data).__name__}, longitud raw: {len(raw)}")

    # Guardar backup
    with open('_backup_partida.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log_msg("Backup guardado en _backup_partida.json")

    # Contar ocurrencias antes
    count_before = raw.count('03.01.01.02')
    soga_before = raw.count('SOGA')
    log_msg(f"Ocurrencias 03.01.01.02 ANTES: {count_before}")
    log_msg(f"Ocurrencias SOGA ANTES: {soga_before}")

    # Buscar paths especificos
    paths_found = []
    def find_paths(obj, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                find_paths(v, f"{path}/{k}")
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                find_paths(v, f"{path}[{i}]")
        elif isinstance(obj, str):
            if '03.01.01.02' in obj:
                paths_found.append((path, obj))

    find_paths(data)
    log_msg(f"\nPaths encontrados: {len(paths_found)}")
    for p, v in paths_found:
        log_msg(f"  {p}")
        log_msg(f"    VAL: {v[:300]}")

    # Reemplazar
    def replace_obj(obj):
        if isinstance(obj, dict):
            return {k: replace_obj(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_obj(v) for v in obj]
        elif isinstance(obj, str):
            s = obj
            if '03.01.01.02' in s:
                s = s.replace('03.01.01.02', '03.01.01.01')
                s = s.replace('TIPO V DE SOGA', 'TIPO V DE CABEZA')
                s = s.replace('Tipo V De Soga', 'Tipo V De Cabeza')
                s = s.replace('tipo v de soga', 'tipo v de cabeza')
            return s
        return obj

    new_data = replace_obj(data)
    new_json = json.dumps(new_data, ensure_ascii=False)
    count_after = new_json.count('03.01.01.02')
    soga_after = new_json.count('SOGA')
    log_msg(f"\nOcurrencias 03.01.01.02 DESPUES: {count_after}")
    log_msg(f"Ocurrencias SOGA DESPUES: {soga_after}")

    # Subir a Firebase
    log_msg("\nSubiendo a Firebase...")
    put_data = new_json.encode('utf-8')
    req = urllib.request.Request(
        'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json',
        data=put_data,
        method='PUT',
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req, timeout=120)
    log_msg(f"Respuesta Firebase: {resp.status}")
    log_msg("CAMBIOS APLICADOS EXITOSAMENTE!")

except Exception as e:
    log_msg(f"\nERROR: {e}")
    log_msg(traceback.format_exc())

save_log()

