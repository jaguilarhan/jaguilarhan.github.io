"""
generar_partidas.py - Lee PRESUPUESTO TOTAL y genera partidas.json para la app.
Solo incluye partidas con metrado (las reales, no títulos).
Clasifica automáticamente por categoría basándose en el nombre.
"""
import openpyxl, json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
EXCEL = os.path.join(BASE, "DATA PARTIDAS", "PRESUPUESTO TOTAL - 01 INFRAESTRUCTURA.xlsx")
OUT = os.path.join(BASE, "src", "partidas.json")

partidas_previas = {}
if os.path.exists(OUT):
    try:
        with open(OUT, "r", encoding="utf-8") as f_prev:
            for pprev in json.load(f_prev):
                cod_prev = str(pprev.get("codigo", "")).strip()
                if cod_prev:
                    partidas_previas[cod_prev] = pprev
    except Exception:
        partidas_previas = {}

wb = openpyxl.load_workbook(EXCEL, data_only=True)
ws = wb.active

# ── Colores por categoría ────────────────────────────────────────
COLORES = {
    "ZAPATAS":          "#E74C3C",
    "CIMIENTOS":        "#E67E22",
    "SOBRECIMIENTOS":   "#F39C12",
    "COLUMNAS":         "#8E44AD",
    "COLUMNETAS":       "#9B59B6",
    "PLACAS":           "#1ABC9C",
    "VIGAS":            "#2980B9",
    "VIGUETAS":         "#3498DB",
    "LOSAS_ALIGERADAS": "#27AE60",
    "LOSAS_MACIZAS":    "#2ECC71",
    "ESCALERAS":        "#16A085",
    "MUROS":            "#607D8B",
    "MUROS_SOST":       "#455A64",
    "PARAPETOS":        "#795548",
    "MESONES":          "#8D6E63",
    "MOVIMIENTO_TIERRAS":"#A1887F",
    "CONCRETO_SIMPLE":  "#FF7043",
    "ARQUITECTURA":     "#42A5F5",
    "INST_SANITARIAS":  "#26C6DA",
    "INST_ELECTRICAS":  "#FFA726",
    "INST_COMUNICACION":"#AB47BC",
    "SEGURIDAD":        "#EF5350",
    "AMBIENTAL":        "#66BB6A",
    "OTROS":            "#90A4AE",
}

def clasificar(codigo, nombre):
    """Clasifica partida por categoría basándose en código y nombre."""
    n = nombre.upper()
    c = codigo

    # Por nombre del elemento estructural
    if "ZAPATA" in n:                    return "ZAPATAS"
    if "CIMIENTO" in n and "SOBRE" not in n: return "CIMIENTOS"
    if "SOBRECIMIENTO" in n:             return "SOBRECIMIENTOS"
    if "COLUMNETA" in n:                 return "COLUMNETAS"
    if "COLUMNA" in n:                   return "COLUMNAS"
    if "PLACA" in n:                     return "PLACAS"
    if "VIGUETA" in n:                   return "VIGUETAS"
    if "VIGA" in n:                      return "VIGAS"
    if "LOSA" in n and "ALIGER" in n:    return "LOSAS_ALIGERADAS"
    if "LOSA" in n and "MACIZ" in n:     return "LOSAS_MACIZAS"
    if "LOSA" in n:                      return "LOSAS_ALIGERADAS"
    if "ESCALERA" in n:                  return "ESCALERAS"
    if "MURO" in n and "SOST" in n:      return "MUROS_SOST"
    if "MURO" in n or "TABIQUE" in n:    return "MUROS"
    if "PARAPETO" in n:                  return "PARAPETOS"
    if "MESON" in n or "MESÓN" in n:     return "MESONES"

    # Por código de especialidad (primeros 2 dígitos)
    esp = c.split(".")[0] if "." in c else c[:2]
    if esp == "01":
        # Dentro de estructuras, subcategorizar
        if "EXCAVAC" in n or "RELLENO" in n or "NIVELAC" in n or "ACARREO" in n or "ELIMINAC" in n:
            return "MOVIMIENTO_TIERRAS"
        if "SOLADO" in n or "FALSO PISO" in n or "SUB ZAPATA" in n:
            return "CONCRETO_SIMPLE"
        return "OTROS"
    if esp == "02": return "OTROS"           # Obras provisionales
    if esp == "03": return "ARQUITECTURA"
    if esp == "04": return "INST_SANITARIAS"
    if esp == "05": return "INST_ELECTRICAS"
    if esp == "06": return "INST_COMUNICACION"
    if esp == "07": return "AMBIENTAL"
    if esp == "08": return "SEGURIDAD"
    return "OTROS"

# ── Primero recolectamos todos los items para construir jerarquía ──
items_raw = []
for row in range(13, ws.max_row + 1):
    codigo_raw = ws.cell(row, 1).value
    nombre_raw = ws.cell(row, 2).value
    metrado    = ws.cell(row, 5).value

    if not codigo_raw or not nombre_raw:
        continue

    codigo = str(codigo_raw).strip()
    nombre = str(nombre_raw).strip()
    if not codigo or not nombre or nombre == 'None':
        continue

    items_raw.append({
        "codigo": codigo,
        "nombre": nombre,
        "metrado": metrado,
        "fila": row,
    })

# ── Construir dict de padres para la ruta jerárquica ──
nombres_por_codigo = {}
for item in items_raw:
    nombres_por_codigo[item["codigo"]] = item["nombre"]

def obtener_especialidad(codigo):
    """Obtiene el código de especialidad (2 dígitos) y su nombre."""
    parts = codigo.split(".")
    esp_cod = parts[0]
    return esp_cod, nombres_por_codigo.get(esp_cod, "")

def obtener_ruta(codigo):
    """Obtiene la ruta jerárquica completa."""
    parts = codigo.split(".")
    ruta = []
    for i in range(1, len(parts)):
        parent_cod = ".".join(parts[:i])
        if parent_cod in nombres_por_codigo:
            ruta.append(nombres_por_codigo[parent_cod])
    return ruta

# ── Generar partidas.json (solo las que tienen metrado) ──
partidas = []
for item in items_raw:
    metrado = item["metrado"]
    if metrado is None or metrado == '' or metrado == 0:
        continue

    codigo = item["codigo"]
    nombre = item["nombre"]
    cat = clasificar(codigo, nombre)
    esp_cod, esp_nombre = obtener_especialidad(codigo)
    ruta = obtener_ruta(codigo)

    partidas.append({
        "codigo": codigo,
        "nombre": nombre,
        "categoria": cat,
        "color": COLORES.get(cat, "#90A4AE"),
        "metrado": float(metrado) if metrado else 0,
        "especialidad": esp_nombre,
        "especialidad_cod": esp_cod,
        "ruta": ruta,
    })

# Ordenar por código
partidas.sort(key=lambda p: [int(x) for x in p["codigo"].split(".")])

# ── Leer PARTIDAS NUEVAS del Excel definitivo ────────────────────
EXCEL_NUEVAS = os.path.join(BASE, "DATA_EXPEDIENTE", "PPTO - PARTIDAS NUEVAS -16M.xlsx")
if not os.path.exists(EXCEL_NUEVAS):
    EXCEL_NUEVAS = os.path.join(BASE, "DATA PARTIDAS", "PPTO - PARTIDAS NUEVAS -16M.xlsx")

if os.path.exists(EXCEL_NUEVAS):
    print("Leyendo partidas nuevas del presupuesto definitivo...")
    wb2 = openpyxl.load_workbook(EXCEL_NUEVAS, data_only=True)
    ws2 = wb2['PRESUPUESTO']

    items_nuevas_raw = []
    for row in range(12, ws2.max_row + 1):
        c1 = str(ws2.cell(row, 1).value or '').strip()
        c2 = str(ws2.cell(row, 2).value or '').strip()
        c4 = str(ws2.cell(row, 4).value or '').strip()
        c5 = ws2.cell(row, 5).value

        if c1 and any(c1.startswith(p) for p in ['11', '12', '13', '14', '15']):
            items_nuevas_raw.append({
                'codigo': c1,
                'nombre': c2,
                'unidad': c4,
                'metrado': float(c5) if c5 is not None else None,
                'is_leaf': bool(c4)
            })

    titles_nuevas = {it['codigo']: it['nombre'] for it in items_nuevas_raw}

    def obtener_ruta_nuevas(codigo):
        parts = codigo.split(".")
        ruta = []
        for i in range(1, len(parts)):
            parent_cod = ".".join(parts[:i])
            if parent_cod in titles_nuevas:
                ruta.append(titles_nuevas[parent_cod])
        return ruta

    count_nuevas = 0
    for item in items_nuevas_raw:
        if not item['is_leaf']:
            continue
        codigo = item["codigo"]
        nombre = item["nombre"]
        metrado = item["metrado"] or 0.0

        if codigo.startswith('11.01.03'):
            cat = 'MOVIMIENTO_TIERRAS'
        elif codigo.startswith('11.03.01'):
            cat = 'SEGURIDAD'
        elif codigo.startswith('11.'):
            cat = 'OTROS'
        elif codigo.startswith('12.01.01'):
            cat = 'CIMIENTOS'
        elif codigo.startswith('12.'):
            cat = 'CONCRETO_SIMPLE'
        elif codigo.startswith('13.01'):
            cat = 'ZAPATAS'
        elif codigo.startswith('13.02'):
            cat = 'PLACAS'
        elif codigo.startswith('14.'):
            cat = 'SEGURIDAD'
        else:
            cat = 'OTROS'

        ruta = obtener_ruta_nuevas(codigo)
        esp_cod = codigo.split(".")[0]
        esp_nombre = titles_nuevas.get(esp_cod, ruta[0] if ruta else "PARTIDAS NUEVAS")

        partidas.append({
            "codigo": codigo,
            "nombre": nombre,
            "categoria": cat,
            "color": COLORES.get(cat, "#90A4AE"),
            "metrado": round(float(metrado), 2),
            "especialidad": esp_nombre,
            "especialidad_cod": esp_cod,
            "ruta": ruta,
            "nueva": True,
        })
        count_nuevas += 1

    print(f"  Partidas nuevas encontradas: {count_nuevas}")
    wb2.close()
else:
    print(f"No se encontro archivo de partidas nuevas: {EXCEL_NUEVAS}")

# Re-ordenar incluyendo las nuevas
partidas.sort(key=lambda p: [int(x) for x in p["codigo"].split(".")])

# ── Guardar src/partidas.json ──
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(partidas, f, ensure_ascii=False, indent=2)

# ── Resumen ──
print(f"Partidas generadas: {len(partidas)}")
print(f"Archivo: {OUT}")
print()

# Conteo por especialidad
from collections import Counter
esp_count = Counter(p["especialidad"] for p in partidas)
print("Por especialidad:")
for esp, cnt in esp_count.most_common():
    print(f"  {cnt:4d}  {esp}")

print()
cat_count = Counter(p["categoria"] for p in partidas)
print("Por categoria:")
for cat, cnt in cat_count.most_common():
    print(f"  {cnt:4d}  {cat}")

# ── Generar partidas_data.js en src, root y docs ───────────────────
js_content = f"// Auto-generado: {len(partidas)} partidas\nconst PARTIDAS = " + json.dumps(partidas, ensure_ascii=False) + ";\n"

for pth in [
    os.path.join(BASE, "src", "partidas_data.js"),
    os.path.join(BASE, "partidas_data.js"),
    os.path.join(BASE, "docs", "partidas_data.js")
]:
    with open(pth, "w", encoding="utf-8") as f:
        f.write(js_content)
print(f"JS generado en src, root y docs ({len(partidas)} partidas)")

