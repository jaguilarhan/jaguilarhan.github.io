"""
servidor.py - Servidor Flask para Control de Obra
Sirve la app web y genera reportes Word.
"""
import os, json, sys, subprocess
from pathlib import Path

try:
    from flask import Flask, request, jsonify, send_from_directory, send_file
except ImportError:
    os.system("pip install flask python-docx openpyxl -q")
    from flask import Flask, request, jsonify, send_from_directory, send_file

BASE = Path(__file__).parent
SRC  = BASE / "src"
app  = Flask(__name__, static_folder=str(SRC))


# ── Servir archivos estaticos ────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(SRC, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    # Primero buscar en src/
    fp = SRC / filename
    if fp.exists():
        return send_from_directory(SRC, filename)
    # Luego en la raiz (para partidas.json, etc.)
    fp2 = BASE / filename
    if fp2.exists():
        return send_from_directory(BASE, filename)
    return "Not found", 404


# ── API: Cargar actividades guardadas ─────────────────────────────
@app.route("/api/actividades", methods=["GET"])
def cargar_actividades():
    json_path = BASE / "actividades_exportadas.json"
    if json_path.exists():
        with open(str(json_path), "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify([])

# ── API: Guardar actividades al servidor ─────────────────────────
@app.route("/api/actividades", methods=["POST"])
def guardar_actividades():
    data = request.json
    if data is None:
        return jsonify({"error": "No se enviaron datos"}), 400
    json_path = BASE / "actividades_exportadas.json"
    with open(str(json_path), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True, "total": len(data)})

# ── API: Generar reporte Word ────────────────────────────────────
@app.route("/api/generar-word", methods=["POST"])
def generar_word():
    data = request.json
    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    desde     = data.get("desde", "")
    hasta     = data.get("hasta", "")
    residente = data.get("residente", "Residente de Obra")
    inspector = data.get("inspector", "Inspector")
    actividades = data.get("actividades", [])

    if not desde or not hasta:
        return jsonify({"error": "Falta rango de fechas"}), 400
    if not actividades:
        return jsonify({"error": "No hay actividades"}), 400

    # Guardar actividades a archivo JSON
    json_path = BASE / "actividades_exportadas.json"
    with open(str(json_path), "w", encoding="utf-8") as f:
        json.dump(actividades, f, ensure_ascii=False, indent=2)

    # Ejecutar generar_reporte.py como subproceso
    try:
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        result = subprocess.run(
            [sys.executable, str(BASE / "generar_reporte.py"),
             desde, hasta, residente, inspector],
            cwd=str(BASE), capture_output=True, text=True, timeout=30,
            env=env
        )
        if result.returncode != 0:
            return jsonify({"error": f"Error generando reporte: {result.stderr}"}), 500

        nombre_archivo = f"Cuaderno_Obra_{desde}_al_{hasta}.docx"
        docx_path = BASE / nombre_archivo

        if docx_path.exists():
            return send_file(str(docx_path), as_attachment=True,
                           download_name=nombre_archivo,
                           mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        else:
            return jsonify({"error": "No se genero el archivo Word"}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 46)
    print("  CONTROL DE ACTIVIDADES DE OBRA")
    print("  http://localhost:8800")
    print("=" * 46)
    import webbrowser, threading
    threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8800")).start()
    app.run(host="0.0.0.0", port=8800, debug=False)

