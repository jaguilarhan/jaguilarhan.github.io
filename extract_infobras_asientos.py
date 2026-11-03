"""Extracción, limpieza y estructuración de asientos de Infobras."""

import json
import re
import urllib.request
from datetime import datetime
from pathlib import Path

INFOBRAS_URL = (
    "https://infobras.contraloria.gob.pe/InfobrasWeb/Mapa/CuadernoObraDigital?obraId=539128"
)
OUTPUT_DIR = Path("DATA_EXPEDIENTE")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def fetch_infobras_html() -> str:
    print(f"Descargando datos desde: {INFOBRAS_URL} ...")
    req = urllib.request.Request(
        INFOBRAS_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_asientos_digitales(html: str) -> list[dict]:
    match = re.search(r"var\s+lAsientoDigital\s*=\s*(\[[\s\S]*?\]);\s*var", html)
    if not match:
        raise ValueError("No se encontró la variable lAsientoDigital en el HTML de Infobras.")
    raw_list = json.loads(match.group(1))
    print(f"Total asientos brutos encontrados: {len(raw_list)}")
    return raw_list


def clean_text(text: str) -> str:
    if not text:
        return ""
    # Reemplazar caracteres especiales de Infobras como ¿ o ¿
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Limpieza de tabulaciones excesivas
    text = re.sub(r"[ \t]+", " ", text)
    # Limpiar líneas vacías excesivas
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_asiento(raw: dict) -> dict:
    desc = clean_text(raw.get("Descripcion", ""))
    
    # Extraer secciones comunes de la descripción si existen
    ocurrencias = ""
    m_oc = re.search(r"(?:-|\*|\b)?\s*Ocurrencias\s*:\s*([\s\S]+)", desc, re.IGNORECASE)
    if m_oc:
        ocurrencias = m_oc.group(1).strip()
    
    # Extraer referencias a otros asientos si las hay (ej: Asiento Nº 501)
    asientos_referidos = [
        int(num) for num in re.findall(r"Asiento\s+(?:N[º°]?\s*)?(\d+)", desc, re.IGNORECASE)
    ]
    # Filtrar auto-referencia si coincide con el número del asiento actual
    curr_num = raw.get("Numero")
    asientos_referidos = [n for n in set(asientos_referidos) if n != curr_num]

    return {
        "numero": raw.get("Numero"),
        "codigo": raw.get("Codigo"),
        "tipo": (raw.get("Tipo") or "").strip(),
        "titulo": (raw.get("Titulo") or "").strip(),
        "rol": (raw.get("Rol") or "").strip().upper(),
        "autor": (raw.get("Usuario") or "").strip(),
        "fecha_asiento": (raw.get("FechaAsiento") or "").strip(),
        "fecha_registro": (raw.get("FechaRegistro") or "").strip(),
        "fecha_pub": (raw.get("FechaPub") or "").strip(),
        "descripcion": desc,
        "ocurrencias": ocurrencias,
        "asientos_referidos": sorted(asientos_referidos),
        "url_doc_hash": raw.get("UrlDocumento", ""),
        "pdf_url": (
            f"https://infobras.contraloria.gob.pe/InfobrasWeb/Mapa/GetFileFolder?"
            f"codigo={raw.get('UrlDocumento')}&extension=pdf&carpeta=cuo_asientos_firma"
            if raw.get("UrlDocumento")
            else ""
        ),
    }


def main():
    html = fetch_infobras_html()
    raw_asientos = extract_asientos_digitales(html)

    asientos = [parse_asiento(a) for a in raw_asientos]
    # Ordenar cronológicamente por número de asiento ascendente (1 a 503)
    asientos.sort(key=lambda x: x["numero"] if x["numero"] is not None else 0)

    # Estadísticas
    residente_asientos = [a for a in asientos if a["rol"] == "RESIDENTE"]
    inspector_asientos = [a for a in asientos if a["rol"] == "INSPECTOR"]

    print("\n--- RESUMEN DE EXTRACCIÓN ---")
    print(f"Total Asientos: {len(asientos)}")
    print(f"Rango de números: Asiento N° {asientos[0]['numero']} al Asiento N° {asientos[-1]['numero']}")
    print(f"Rango de fechas: {asientos[0]['fecha_asiento']} hasta {asientos[-1]['fecha_asiento']}")
    print(f"Asientos Residente: {len(residente_asientos)}")
    print(f"Asientos Inspector: {len(inspector_asientos)}")

    # Guardar archivo global
    global_path = OUTPUT_DIR / "asientos_infobras.json"
    with open(global_path, "w", encoding="utf-8") as f:
        json.dump(asientos, f, ensure_ascii=False, indent=2)
    print(f"\nArchivo global guardado: {global_path} ({global_path.stat().st_size / 1024:.2f} KB)")

    # Filtrar Octubre 2026
    octubre_asientos = [
        a for a in asientos
        if "/10/2026" in a["fecha_asiento"] or "OCTUBRE" in a["titulo"].upper()
    ]
    octubre_path = OUTPUT_DIR / "asientos_octubre_2026.json"
    with open(octubre_path, "w", encoding="utf-8") as f:
        json.dump(octubre_asientos, f, ensure_ascii=False, indent=2)
    print(f"Archivo Octubre 2026 guardado: {octubre_path} ({len(octubre_asientos)} asientos)")

    # Extraer observaciones pendientes del Inspector en Octubre
    obs_inspector = [
        a for a in octubre_asientos
        if a["rol"] == "INSPECTOR" and (a["ocurrencias"] or a["asientos_referidos"] or "observ" in a["descripcion"].lower() or "solicita" in a["descripcion"].lower())
    ]
    print(f"\nAsientos de Inspector con observaciones/solicitudes en Octubre: {len(obs_inspector)}")
    for o in obs_inspector[-5:]:
        print(f"\n* Asiento N° {o['numero']} ({o['fecha_asiento']}) - Inspector: {o['autor']}")
        if o["asientos_referidos"]:
            print(f"  Referencia a asientos de Residente: {o['asientos_referidos']}")
        snippet = (o["ocurrencias"] or o["descripcion"])[:250].replace("\n", " ")
        print(f"  Detalle: {snippet}...")


if __name__ == "__main__":
    main()
