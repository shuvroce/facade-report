import os
import yaml
import tempfile
import threading
import shutil
from flask import Flask, request, send_file, render_template
from report import generate_report_from_data, TEMPLATE_DIR, load_profile_data

app = Flask(__name__, static_folder="static", template_folder="templates")

def _del_later(path, delay=30):
    t = threading.Timer(delay, lambda: shutil.rmtree(path, ignore_errors=True))
    t.daemon = True
    t.start()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate_report", methods=["POST"])
def generate_report():
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400

    yaml_content = request.json["yaml_content"]
    report_data = yaml.safe_load(yaml_content) or {}

    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
    if profile_data:
        merged = {}
        merged.update(profile_data)
        merged.update(report_data)
        report_data = merged

    # per-request temp dir and output filename
    temp_dir = tempfile.mkdtemp()
    project_name = report_data.get("project_info", {}).get("project_name", "project")
    safe_name = "".join(c for c in project_name if c.isalnum() or c in (" ", "_")).strip().replace(" ", "_")
    out_pdf = os.path.join(temp_dir, f"{safe_name}_report.pdf")

    # generate and return
    pdf_path = generate_report_from_data(data=report_data, out_pdf=out_pdf, template_dir=TEMPLATE_DIR)

    _del_later(temp_dir, delay=30)  # cleanup later
    return send_file(pdf_path, mimetype="application/pdf", as_attachment=True, download_name=os.path.basename(pdf_path), max_age=0)

if __name__ == "__main__":
    app.run(debug=True)