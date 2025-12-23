import os
import yaml
import tempfile
from flask import Flask, render_template, request, send_file, jsonify, session
from report import generate_report_from_data, load_profile_data
try:
    from tkinter import Tk
    from tkinter.filedialog import askdirectory
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False

app = Flask(__name__)
app.secret_key = 'facade_report_secret_key'

# Directory paths
BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
DEFAULT_INPUTS_DIR = os.path.join(TEMPLATE_DIR, "inputs")

# Get INPUTS_DIR from session or use default
def get_inputs_dir():
    return session.get('inputs_dir', DEFAULT_INPUTS_DIR)

def set_inputs_dir(directory):
    session['inputs_dir'] = directory


# UTILITY FUNCTIONS
def sanitize_filename(name):
    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_"))
    return safe_name.strip().replace(" ", "_")

def merge_profile_data(report_data):
    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
    if profile_data:
        merged = {}
        merged.update(profile_data)
        merged.update(report_data)
        return merged
    return report_data

def get_required_wind_figures():
    return [
        {"name": "wind-location-map.png", "category": "Wind", "exists": False},
        {"name": "wind-mwfrs.png", "category": "Wind", "exists": False},
        {"name": "wind-cnc-wall.png", "category": "Wind", "exists": False},
        {"name": "wind-cnc-roof.png", "category": "Wind", "exists": False}
    ]

def get_manual_profile_figures(profile_name):
    clean_name = profile_name.strip()
    figure_suffixes = [
        ".png", "-wp.png", "p.png", "-lb-web.png", "-lb-flange.png",
        "-lb-table.png", "-lb-web-cap.png", "-lb-flange-cap.png"
    ]
    
    return [
        {"name": f"{clean_name}{suffix}", "category": "Aluminum Profile", "exists": False}
        for suffix in figure_suffixes
    ]

def get_sap_figures(category_index):
    sap_figure_names = [
        "sap-model.png", "sap-release.png", "sap-dead-load.png", "sap-wind-load.png",
        "sap-bmd.png", "sap-sfd.png", "sap-mul-max-moment.png", "sap-tran-max-moment.png",
        "sap-deformed-shape.png", "sap-mul-def.png", "sap-tran-def-wind.png",
        "sap-tran-def-dead.png", "sap-joint-force-dead.png", "sap-joint-force-wind.png",
        "sap-reaction-force-dead.png", "sap-reaction-force-wind.png"
    ]
    
    return [
        {"name": f"{category_index}-{fig}", "category": f"Category {category_index}", "exists": False}
        for fig in sap_figure_names
    ]

def get_comp_profile_figures(category_index, mullion_name):
    clean_name = mullion_name.strip()
    
    return [
        {"name": f"{clean_name}.png", "category": f"Category {category_index}", "exists": False}
    ]

def get_rfem_figures(category_index, glass_index):
    rfem_figure_names = [
        "rfem-model-3d.png", "rfem-model-data.png", "rfem-stress.png",
        "rfem-stress-ratio.png", "rfem-def.png", "rfem-def-ratio.png"
    ]
    
    return [
        {
            "name": f"{category_index}.{glass_index}-{fig}",
            "category": f"Category {category_index} - Glass {glass_index}",
            "exists": False
        }
        for fig in rfem_figure_names
    ]

def check_figure_existence(figures):
    inputs_dir = get_inputs_dir()
    for fig in figures:
        fig_path = os.path.join(inputs_dir, fig["name"])
        fig["exists"] = os.path.isfile(fig_path)
    
    return figures


# ROUTE HANDLERS
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate_report", methods=["POST"])
def generate_report():
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400

    # Parse YAML content
    yaml_content = request.json["yaml_content"]
    report_data = yaml.safe_load(yaml_content) or {}

    # Merge with profile data
    report_data = merge_profile_data(report_data)

    # Create temporary directory and determine output filename
    temp_dir = tempfile.mkdtemp()
    out_pdf = os.path.join(temp_dir, "report.pdf")

    # Generate PDF report
    pdf_path = generate_report_from_data(
        data=report_data,
        out_pdf=out_pdf,
        template_dir=TEMPLATE_DIR,
        inputs_dir=get_inputs_dir()
    )
    
    return send_file(
        pdf_path,
        as_attachment=True,
        download_name="report.pdf",
        mimetype="application/pdf"
    )


@app.route("/check_figures", methods=["POST"])
def check_figures():
    # Validate request
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400
    
    # Parse YAML content
    yaml_content = request.json["yaml_content"]
    try:
        data = yaml.safe_load(yaml_content) or {}
    except Exception as e:
        return {"success": False, "error": f"Invalid YAML: {str(e)}"}, 400
    
    required_figures = []
    
    # Add wind figures (always required)
    required_figures.extend(get_required_wind_figures())
    
    # Add manual aluminum profile figures
    if "alum_profiles" in data:
        for profile in data["alum_profiles"]:
            profile_type = profile.get("profile_type", "")
            
            if profile_type == "Manual":
                profile_name = profile.get("profile_name", "")
                if profile_name:
                    required_figures.extend(get_manual_profile_figures(profile_name))
    
    # Add category-based figures
    if "categories" in data:
        for cat_idx, category in enumerate(data["categories"], start=1):
            # Reference elevation
            required_figures.append({
                "name": f"{cat_idx}-ref-elev.png",
                "category": f"Category {cat_idx}",
                "exists": False
            })
            
            # SAP analysis figures
            required_figures.extend(get_sap_figures(cat_idx))
            
            # Glass RFEM figures (only for Point Fixed support type)
            if "glass_units" in category:
                for glass_idx, glass in enumerate(category["glass_units"], start=1):
                    support_type = glass.get("support_type", "")
                    
                    if support_type == "Point Fixed":
                        required_figures.extend(get_rfem_figures(cat_idx, glass_idx))
            
            # Add composite profile figures
            if "frames" in category:
                for frame in category["frames"]:
                    mullion_type = frame.get("mullion_type", "")
                    
                    if mullion_type == "Aluminum + Steel":
                        mullion_name = frame.get("mullion", "")
                        if mullion_name:
                            required_figures.extend(get_comp_profile_figures(cat_idx, mullion_name))
    
    # Check existence of all figures
    required_figures = check_figure_existence(required_figures)
    
    return jsonify({"success": True, "figures": required_figures})


# Input helper guide
@app.route("/input-helper")
def input_helper():
    return render_template("input-helper.html")


# Preview summary
@app.route("/preview_summary", methods=["POST"])
def preview_summary():
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400

    # Parse YAML content
    yaml_content = request.json["yaml_content"]
    data = yaml.safe_load(yaml_content) or {}

    # Merge with profile data
    data = merge_profile_data(data)

    # Ensure nested dicts exist to avoid KeyErrors in template
    data.setdefault('project_info', {})
    data.setdefault('include', {})
    data.setdefault('wind', {})

    return render_template("summary.html", data=data)


@app.route("/set_inputs_dir", methods=["POST"])
def set_inputs_directory():
    """Set the inputs directory from user selection"""
    if not request.json or "directory" not in request.json:
        return {"success": False, "error": "Missing directory path"}, 400
    
    directory = request.json["directory"]
    
    # Validate that the directory exists
    if not os.path.isdir(directory):
        return {"success": False, "error": f"Directory does not exist: {directory}"}, 400
    
    # Set the directory in session
    set_inputs_dir(directory)
    
    return {"success": True, "directory": directory, "message": "Inputs directory set successfully"}


@app.route("/get_inputs_dir", methods=["GET"])
def get_inputs_directory():
    """Get the current inputs directory"""
    current_dir = get_inputs_dir()
    return {
        "success": True,
        "directory": current_dir,
        "is_default": current_dir == DEFAULT_INPUTS_DIR
    }


@app.route("/open_folder_picker", methods=["GET"])
def open_folder_picker():
    if not TKINTER_AVAILABLE:
        return {
            "success": False,
            "error": "Folder picker not available on this system"
        }, 400
    
    try:
        # Hide the tkinter root window
        root = Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        # Open folder picker dialog
        selected_dir = askdirectory(
            title="Select Inputs Directory",
            mustexist=True
        )
        
        root.destroy()
        
        if not selected_dir:
            return {
                "success": False,
                "error": "No folder selected"
            }, 400
        
        # Validate directory exists
        if not os.path.isdir(selected_dir):
            return {
                "success": False,
                "error": f"Selected folder does not exist: {selected_dir}"
            }, 400
        
        # Set the directory in session
        set_inputs_dir(selected_dir)
        
        return {
            "success": True,
            "directory": selected_dir,
            "message": "Inputs directory set successfully"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"Error opening folder picker: {str(e)}"
        }, 500


# APPLICATION ENTRY POINT
if __name__ == "__main__":
    # app.run(debug=True, port=5000)
    app.run(debug=True, host="0.0.0.0", port=5000)
