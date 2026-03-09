import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('backups/backup_ULTIMO.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

acts = data.get('actividades', [])
print(f"Total actividades: {len(acts)}")

# Find all unique elements containing PL
elems = set()
for a in acts:
    e = a.get('elemento', '') or ''
    elems.add(e)

print("\n=== Elementos con PL ===")
for e in sorted(elems):
    if 'PL' in e.upper():
        print(f"  {repr(e)}")

print("\n=== Actividades PL-01 en 5to Nivel ===")
for a in acts:
    elem = a.get('elemento', '') or ''
    nivel = a.get('nivel', '') or ''
    # Check if PL-01 is in the element (case insensitive)
    if 'PL-01' in elem.upper() and '5TO' in nivel.upper():
        desc = a.get('descripcion', '')
        ejes = a.get('ejes', '')
        fecha = a.get('fecha', '')
        cat = a.get('partida', {}).get('categoria', '')
        print(f"  {desc} | {elem} | {ejes} | {fecha} | {cat}")

print("\n=== Actividades con ENCOFRADO y PLACAS en 5to Nivel ===")
for a in acts:
    desc = (a.get('descripcion', '') or '').upper()
    elem = (a.get('elemento', '') or '').upper()
    nivel = (a.get('nivel', '') or '').upper()
    partida_nombre = (a.get('partida', {}).get('nombre', '') or '').upper()
    if 'ENCOFRADO' in desc and 'PLACA' in elem and '5TO' in nivel:
        print(f"  {a.get('descripcion','')} | {a.get('elemento','')} | {a.get('ejes','')} | {a.get('fecha','')} | {a.get('partida',{}).get('categoria','')}")

print("\n=== Todas las actividades con eje que contiene 3/A en 5to Nivel ===")
for a in acts:
    ejes = (a.get('ejes', '') or '')
    nivel = (a.get('nivel', '') or '').upper()
    if '3/A' in ejes and '5TO' in nivel:
        desc = a.get('descripcion', '')
        elem = a.get('elemento', '')
        fecha = a.get('fecha', '')
        print(f"  {desc} | {elem} | {ejes} | {fecha}")

