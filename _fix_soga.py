import urllib.request
import json

log = []
def save():
    with open('_fix_log2.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(log))

try:
    log.append("Descargando datos...")
    save()

    url = 'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json'
    r = urllib.request.urlopen(url, timeout=60)
    raw = r.read().decode('utf-8')
    data = json.loads(raw)

    log.append(f"SOGA antes: {raw.count('SOGA')}")

    # Reemplazar SOGA por CABEZA en todo el JSON
    def replace_obj(obj):
        if isinstance(obj, dict):
            return {k: replace_obj(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [replace_obj(v) for v in obj]
        elif isinstance(obj, str):
            if 'SOGA' in obj:
                return obj.replace('SOGA', 'CABEZA')
            return obj
        return obj

    new_data = replace_obj(data)
    new_json = json.dumps(new_data, ensure_ascii=False)
    log.append(f"SOGA despues: {new_json.count('SOGA')}")
    log.append(f"CABEZA despues: {new_json.count('CABEZA')}")

    # Subir
    log.append("Subiendo...")
    save()

    put_data = new_json.encode('utf-8')
    req = urllib.request.Request(
        'https://proyect3082-default-rtdb.firebaseio.com/obra_data.json',
        data=put_data,
        method='PUT',
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req, timeout=120)
    log.append(f"Firebase: {resp.status}")
    log.append("LISTO!")

except Exception as e:
    import traceback
    log.append(f"ERROR: {e}")
    log.append(traceback.format_exc())

save()

