import urllib.request
import json

# Ver estructura raiz
url = 'https://proyect3082-default-rtdb.firebaseio.com/.json?shallow=true'
r = urllib.request.urlopen(url)
data = r.read().decode('utf-8')
print("Estructura raiz:")
print(data[:3000])

# Buscar en cada nodo
root = json.loads(data)
if isinstance(root, dict):
    for key in root.keys():
        print(f"\n--- Buscando en nodo: {key} ---")
        try:
            url2 = f'https://proyect3082-default-rtdb.firebaseio.com/{key}.json'
            r2 = urllib.request.urlopen(url2)
            content = r2.read().decode('utf-8')
            if '03.01.01.02' in content:
                print(f"  ENCONTRADO en {key}!")
                # Contar ocurrencias
                count = content.count('03.01.01.02')
                print(f"  Ocurrencias: {count}")
            else:
                print(f"  No encontrado")
        except Exception as e:
            print(f"  Error: {e}")

