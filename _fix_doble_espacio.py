import urllib.request, json, ssl

ctx = ssl.create_default_context()
url = "https://proyect3082-default-rtdb.firebaseio.com/obra_data/actividades.json"
r = urllib.request.urlopen(url, context=ctx, timeout=15)
data = json.loads(r.read().decode("utf-8"))
acts = [a for a in data if a is not None]

# Buscar actividades con espacios dobles en descripcion
problemas = []
for i, a in enumerate(acts):
    desc = a.get("descripcion", "")
    normalized = " ".join(desc.split())  # colapsar espacios
    if desc != normalized:
        problemas.append((i, a, desc, normalized))

print(f"Actividades con espacios extra: {len(problemas)}")
for idx, a, orig, norm in problemas:
    print(f"  ID:{a['id']} Fecha:{a['fecha']} [{orig}] -> [{norm}]")

# Corregir en el array
if problemas:
    for idx, a, orig, norm in problemas:
        # Buscar en data original (puede tener nulls)
        for j, item in enumerate(data):
            if item is not None and item.get("id") == a["id"]:
                data[j]["descripcion"] = norm
                break

    # Guardar de vuelta en Firebase
    save_url = "https://proyect3082-default-rtdb.firebaseio.com/obra_data/actividades.json"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(save_url, data=payload, method="PUT")
    req.add_header("Content-Type", "application/json")
    resp = urllib.request.urlopen(req, context=ctx, timeout=30)
    print(f"\n✅ Corregidos {len(problemas)} registros en Firebase (status: {resp.status})")
else:
    print("✅ No hay actividades con espacios extra")

