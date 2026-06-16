import urllib.request
import json

output_lines = []

try:
    # Ver estructura raiz
    url = 'https://proyect3082-default-rtdb.firebaseio.com/.json?shallow=true'
    r = urllib.request.urlopen(url)
    data = r.read().decode('utf-8')
    root = json.loads(data)
    output_lines.append(f"Nodos raiz: {list(root.keys()) if isinstance(root, dict) else 'No es dict'}")

    if isinstance(root, dict):
        for key in root.keys():
            try:
                url2 = f'https://proyect3082-default-rtdb.firebaseio.com/{key}.json'
                r2 = urllib.request.urlopen(url2)
                content = r2.read().decode('utf-8')
                if '03.01.01.02' in content:
                    count = content.count('03.01.01.02')
                    output_lines.append(f"ENCONTRADO en {key}! Ocurrencias: {count}")
                else:
                    output_lines.append(f"No en {key}")
            except Exception as e:
                output_lines.append(f"Error en {key}: {e}")
except Exception as e:
    output_lines.append(f"Error general: {e}")

with open('C:/Users/Jose Alonso/IntelliJ_IDEA/work_manage_app/_find_result.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

