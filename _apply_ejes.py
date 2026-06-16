#!/usr/bin/env python3
"""Aplica los ejes predefinidos de tabiquería en docs/index.html, index.html y src/index.html"""
import re, os

OLD_BLOCK = """  // Agrupar por nivel + ejes normalizados
  const zonas = {};
  actsTabi.forEach(a => {
    const nivel = a.nivel || '\u2014';
    const ejesNorm = normalizarEjes(a.ejes || '\u2014');
    if (ejesNorm === '\u2014') return; // ignorar sin ejes
    const key = `${nivel}||${ejesNorm}`;
    if (!zonas[key]) zonas[key] = { nivel, ejes: ejesNorm, acts: [] };
    zonas[key].acts.push(a);
  });

  // Para cada zona, determinar qu\u00e9 pasos est\u00e1n completos
  const zonasArr = Object.values(zonas).sort((a, b) => {
    const nivelOrd = {'1er Nivel':1,'2do Nivel':2,'3er Nivel':3,'4to Nivel':4,'5to Nivel':5,'6to Nivel':6,'Azotea':7};
    return (nivelOrd[a.nivel]||99) - (nivelOrd[b.nivel]||99) || a.ejes.localeCompare(b.ejes);
  });"""

NEW_BLOCK = """  // \u2500\u2500 EJES PREDEFINIDOS para tabiquer\u00eda (Columnetas, Viguetas, Muros) \u2500\u2500
  const EJES_TABIQUERIA_PREDEFINIDOS = [
    '1/A-B','1/B-C','1/C-D','1/D-E','1/E-E\\'',
    '1-2/A','1-2/B','1-2/C-D',
    '2/D-E',
    '2-3/B-C','2-3/C-D',
    '2-3/A',
    '3/A-B','3/B-C','3/C-D','3/D-E','3/E-E\\''
  ];
  const NIVELES_TABIQUERIA = ['2do Nivel','3er Nivel','4to Nivel'];

  // Agrupar por nivel + ejes normalizados (actividades reales)
  const zonas = {};
  actsTabi.forEach(a => {
    const nivel = a.nivel || '\u2014';
    const ejesNorm = normalizarEjes(a.ejes || '\u2014');
    if (ejesNorm === '\u2014') return;
    const key = `${nivel}||${ejesNorm}`;
    if (!zonas[key]) zonas[key] = { nivel, ejes: ejesNorm, acts: [] };
    zonas[key].acts.push(a);
  });

  // Agregar zonas predefinidas que no existan a\u00fan (para ver todo el avance)
  NIVELES_TABIQUERIA.forEach(nivel => {
    if (filtNivel && filtNivel !== nivel) return;
    EJES_TABIQUERIA_PREDEFINIDOS.forEach(eje => {
      const ejesNorm = normalizarEjes(eje);
      const key = `${nivel}||${ejesNorm}`;
      if (!zonas[key]) {
        zonas[key] = { nivel, ejes: ejesNorm, acts: [] };
      }
    });
  });

  // Para cada zona, determinar qu\u00e9 pasos est\u00e1n completos
  const zonasArr = Object.values(zonas).sort((a, b) => {
    const nivelOrd = {'1er Nivel':1,'2do Nivel':2,'3er Nivel':3,'4to Nivel':4,'5to Nivel':5,'6to Nivel':6,'Azotea':7};
    return (nivelOrd[a.nivel]||99) - (nivelOrd[b.nivel]||99) || a.ejes.localeCompare(b.ejes);
  });"""

base = r"C:\Users\Jose Alonso\IntelliJ_IDEA\work_manage_app"
files = [
    os.path.join(base, "docs", "index.html"),
    os.path.join(base, "index.html"),
    os.path.join(base, "src", "index.html"),
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'EJES_TABIQUERIA_PREDEFINIDOS' in content:
        print(f"[SKIP] {fpath} - ya tiene los cambios")
        continue

    if OLD_BLOCK in content:
        content = content.replace(OLD_BLOCK, NEW_BLOCK, 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] {fpath} - cambios aplicados")
    else:
        # Try flexible matching
        print(f"[WARN] {fpath} - bloque original no encontrado exactamente, intentando flexible...")
        # Search for the key pattern
        pattern = r"(  // Agrupar por nivel \+ ejes normalizados\n  const zonas = \{\};\n  actsTabi\.forEach.*?\n  \}\);\n\n  // Para cada zona.*?localeCompare\(b\.ejes\);\n  \}\);)"
        m = re.search(pattern, content, re.DOTALL)
        if m:
            content = content[:m.start()] + NEW_BLOCK + content[m.end():]
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK-FLEX] {fpath} - cambios aplicados con matching flexible")
        else:
            print(f"[ERROR] {fpath} - no se pudo encontrar el bloque a reemplazar")

print("\nDone!")

