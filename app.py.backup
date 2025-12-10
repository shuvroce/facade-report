import os
import yaml
import tempfile
from flask import Flask, render_template, request, send_file, jsonify
from report import generate_report_from_data, load_profile_data

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
INPUTS_DIR = os.path.join(TEMPLATE_DIR, "inputs")

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
    return send_file(pdf_path, as_attachment=True, download_name=f"{safe_name}_report.pdf", mimetype="application/pdf")

@app.route("/check_figures", methods=["POST"])
def check_figures():
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400
    
    yaml_content = request.json["yaml_content"]
    try:
        data = yaml.safe_load(yaml_content) or {}
    except Exception as e:
        return {"success": False, "error": f"Invalid YAML: {str(e)}"}, 400
    
    required_figures = []
    
    # Wind figures (always required)
    required_figures.extend([
        {"name": "location-map.png", "category": "Wind", "exists": False},
        {"name": "mwfrs.png", "category": "Wind", "exists": False},
        {"name": "cnc-wall.png", "category": "Wind", "exists": False},
        {"name": "cnc-roof.png", "category": "Wind", "exists": False}
    ])
    
    # Manual Aluminum profile figures (only for profile_type = "Manual")
    if "alum_profiles" in data:
        for idx, profile in enumerate(data["alum_profiles"], start=1):
            profile_type = profile.get("profile_type", "")
            
            if profile_type == "Manual":
                profile_name = profile.get("profile_name", "")
                
                if profile_name:
                    # Clean the profile name (remove spaces and special chars for filename)
                    clean_name = profile_name.strip()
                    
                    required_figures.extend([
                        {"name": f"{clean_name}.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-wp.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}p.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-lb-web.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-lb-flange.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-lb-table.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-lb-web-cap.png", "category": "Aluminum Profile", "exists": False},
                        {"name": f"{clean_name}-lb-flange-cap.png", "category": "Aluminum Profile", "exists": False}
                    ])
    
    # Category-based figures
    if "categories" in data:
        for cat_idx, category in enumerate(data["categories"], start=1):            
            # Reference elevation
            required_figures.append({
                "name": f"{cat_idx}-ref-elev.png",
                "category": f"Category {cat_idx}",
                "exists": False
            })
            
            # SAP figures
            sap_figures = [
                "sap-model.png", "sap-relese.png", "sap-support1.png", "sap-support2.png",
                "sap-dead-load.png", "sap-wind-load.png", "sap-load-combo.png",
                "sap-bmd.png", "sap-sfd.png", "sap-mul-max-moment.png", "sap-tran-max-moment.png",
                "sap-deformed-shape.png", "sap-mul-def.png", "sap-tran-def-wind.png",
                "sap-tran-def-dead.png", "sap-joint-force-dead.png", "sap-joint-force-wind.png",
                "sap-reaction-force-dead.png", "sap-reaction-force-wind.png"
            ]
            for fig in sap_figures:
                required_figures.append({
                    "name": f"{cat_idx}-{fig}",
                    "category": f"Category {cat_idx}",
                    "exists": False
                })
            
            # Glass RFEM figures - check support_type
            if "glass_units" in category:
                for glass_idx, glass in enumerate(category["glass_units"], start=1):
                    support_type = glass.get("support_type", "")
                    
                    # Check for Point Fixed (exact match)
                    is_point_fixed = support_type == "Point Fixed"
                    
                    if is_point_fixed:
                        rfem_figures = [
                            "rfem-model-3d.png", "rfem-model-data.png", "rfem-stress.png",
                            "rfem-stress-ratio.png", "rfem-def.png", "rfem-def-ratio.png"
                        ]
                        for fig in rfem_figures:
                            required_figures.append({
                                "name": f"{cat_idx}.{glass_idx}-{fig}",
                                "category": f"Category {cat_idx} - Glass {glass_idx}",
                                "exists": False
                            })
            
            # Anchorage figures
            if "anchorage" in category:
                l_clump_added = False  # Flag to track if L clump figures are already added
                for anchor_idx, anchor in enumerate(category["anchorage"], start=1):
                    clump_type = anchor.get("clump_type", "")
                    
                    if clump_type in ["L Clump Top", "L Clump Front"] and not l_clump_added:
                        # Add L clump figures only once per category
                        l_clump_figs = [
                            "l-clump-plan.png", "l-clump-section.png", "l-clump-forces.png"
                        ]
                        for fig in l_clump_figs:
                            required_figures.append({
                                "name": f"{cat_idx}-{fig}",
                                "category": f"Category {cat_idx}",
                                "exists": False
                            })
                        l_clump_added = True
    
    # Check which files actually exist
    print(f"\nChecking {len(required_figures)} figures in: {INPUTS_DIR}")
    for fig in required_figures:
        fig_path = os.path.join(INPUTS_DIR, fig["name"])
        fig["exists"] = os.path.isfile(fig_path)

    return jsonify({"success": True, "figures": required_figures})

@app.route("/input-helper.txt")
def input_helper():
    """Serve the input-helper.txt file"""
    helper_path = os.path.join(BASE_DIR, "input-helper.txt")
    if os.path.isfile(helper_path):
        return send_file(helper_path, mimetype="text/plain")
    else:
        return "Input helper file not found", 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)