import os
import yaml
import tempfile
import threading
import shutil
from flask import Flask, request, send_file, render_template
from report import generate_report_from_data

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
    data = yaml.safe_load(yaml_content) or {}

    # per-request temp dir and output filename
    temp_dir = tempfile.mkdtemp()
    project_name = data.get("project_info", {}).get("project_name", "project")
    safe_name = "".join(c for c in project_name if c.isalnum() or c in (" ", "_")).strip().replace(" ", "_")
    out_pdf = os.path.join(temp_dir, f"{safe_name}_report.pdf")

    # generate and return
    pdf_path = generate_report_from_data(data=data, out_pdf=out_pdf, template_dir=os.path.join(app.root_path, "templates"))

    _del_later(temp_dir, delay=30)  # cleanup later
    return send_file(pdf_path, mimetype="application/pdf", as_attachment=True, download_name=os.path.basename(pdf_path), max_age=0)

if __name__ == "__main__":
    app.run(debug=True)