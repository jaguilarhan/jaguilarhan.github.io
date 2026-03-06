import urllib.request, json, ssl
ctx = ssl.create_default_context()
url = "https://proyect3082-default-rtdb.firebaseio.com/obra_data/actividades.json"
r = urllib.request.urlopen(url, context=ctx, timeout=15)
data = json.loads(r.read().decode("utf-8"))
acts = [a for a in data if a is not None]

# Buscar actividades con HABILITADO y ARMADO y ACERO en descripcion
hab = [a for a in acts if
    "HABILITADO" in (a.get("descripcion","").upper()) and
    "ARMADO" in (a.get("descripcion","").upper()) and
    "ACERO" in (a.get("descripcion","").upper())]

print(f"Total: {len(hab)} actividades con HABILITADO Y ARMADO DE ACERO")
descs = set()
for a in hab:
    descs.add(repr(a.get("descripcion","")))
print(f"Descripciones unicas encontradas: {descs}")
print()
for a in hab:
    print(f"ID:{a['id']}  Fecha:{a['fecha']}  Desc:[{a['descripcion']}]  Cat:{a['partida']['categoria']}  Ejes:{a.get('ejes','?')}  Nivel:{a.get('nivel','?')}")

# Tambien mostrar todas las descripciones unicas para ver si hay variantes
print("\n--- TODAS LAS DESCRIPCIONES UNICAS ---")
all_descs = sorted(set(a.get("descripcion","") for a in acts))
for d in all_descs:
    count = sum(1 for a in acts if a.get("descripcion","") == d)
    print(f"  [{d}] x{count}")

