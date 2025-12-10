"""
============================================================================
FACADE REPORT GENERATOR - FLASK APPLICATION
Last Updated: December 10, 2025
============================================================================

This Flask application serves as the backend for the Facade Report Generator.
It handles:
- Serving the web interface
- Processing YAML input and generating PDF reports
- Checking figure file status
- Serving helper documentation

Routes:
- GET  /                  : Main application interface
- POST /generate_report   : Generate and download PDF report
- POST /check_figures     : Check existence of required figure files
- GET  /input-helper.txt  : Serve input helper documentation
"""

import os
import yaml
import tempfile
from flask import Flask, render_template, request, send_file, jsonify
from report import generate_report_from_data, load_profile_data


# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

app = Flask(__name__)

# Directory paths
BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
INPUTS_DIR = os.path.join(TEMPLATE_DIR, "inputs")


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def sanitize_filename(name):
    """
    Create a safe filename by removing/replacing invalid characters.
    
    Args:
        name (str): Original filename or project name
        
    Returns:
        str: Sanitized filename safe for file systems
    """
    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_"))
    return safe_name.strip().replace(" ", "_")


def merge_profile_data(report_data):
    """
    Merge profile data from YAML file with report data.
    
    Args:
        report_data (dict): Report data from user input
        
    Returns:
        dict: Merged report data with profile information
    """
    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
    if profile_data:
        merged = {}
        merged.update(profile_data)
        merged.update(report_data)
        return merged
    return report_data


def get_required_wind_figures():
    """
    Get list of required wind-related figures.
    
    Returns:
        list: List of figure dictionaries with name, category, and exists status
    """
    return [
        {"name": "location-map.png", "category": "Wind", "exists": False},
        {"name": "mwfrs.png", "category": "Wind", "exists": False},
        {"name": "cnc-wall.png", "category": "Wind", "exists": False},
        {"name": "cnc-roof.png", "category": "Wind", "exists": False}
    ]


def get_manual_profile_figures(profile_name):
    """
    Get list of required figures for a manual aluminum profile.
    
    Args:
        profile_name (str): Name of the profile
        
    Returns:
        list: List of figure dictionaries for the profile
    """
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
    """
    Get list of required SAP analysis figures for a category.
    
    Args:
        category_index (int): Index of the category (1-based)
        
    Returns:
        list: List of SAP figure dictionaries
    """
    sap_figure_names = [
        "sap-model.png", "sap-relese.png", "sap-support1.png", "sap-support2.png",
        "sap-dead-load.png", "sap-wind-load.png", "sap-load-combo.png",
        "sap-bmd.png", "sap-sfd.png", "sap-mul-max-moment.png", "sap-tran-max-moment.png",
        "sap-deformed-shape.png", "sap-mul-def.png", "sap-tran-def-wind.png",
        "sap-tran-def-dead.png", "sap-joint-force-dead.png", "sap-joint-force-wind.png",
        "sap-reaction-force-dead.png", "sap-reaction-force-wind.png"
    ]
    
    return [
        {"name": f"{category_index}-{fig}", "category": f"Category {category_index}", "exists": False}
        for fig in sap_figure_names
    ]


def get_rfem_figures(category_index, glass_index):
    """
    Get list of required RFEM analysis figures for a glass unit.
    
    Args:
        category_index (int): Index of the category (1-based)
        glass_index (int): Index of the glass unit within category (1-based)
        
    Returns:
        list: List of RFEM figure dictionaries
    """
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


def get_l_clump_figures(category_index):
    """
    Get list of required L clump anchorage figures for a category.
    
    Args:
        category_index (int): Index of the category (1-based)
        
    Returns:
        list: List of L clump figure dictionaries
    """
    l_clump_names = ["l-clump-plan.png", "l-clump-section.png", "l-clump-forces.png"]
    
    return [
        {"name": f"{category_index}-{fig}", "category": f"Category {category_index}", "exists": False}
        for fig in l_clump_names
    ]


def check_figure_existence(figures):
    """
    Check if figure files exist in the inputs directory.
    
    Args:
        figures (list): List of figure dictionaries to check
        
    Returns:
        list: Updated list with exists status set for each figure
    """
    for fig in figures:
        fig_path = os.path.join(INPUTS_DIR, fig["name"])
        fig["exists"] = os.path.isfile(fig_path)
    
    return figures


# ============================================================================
# ROUTE HANDLERS
# ============================================================================

@app.route("/")
def index():
    """
    Serve the main application interface.
    
    Returns:
        str: Rendered HTML template
    """
    return render_template("index.html")


@app.route("/generate_report", methods=["POST"])
def generate_report():
    """
    Generate a PDF report from YAML content.
    
    Expects JSON payload with 'yaml_content' field containing YAML string.
    Merges with profile data and generates PDF report.
    
    Returns:
        file: PDF file download
        tuple: Error response with status code if request is invalid
    """
    # Validate request
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400

    # Parse YAML content
    yaml_content = request.json["yaml_content"]
    report_data = yaml.safe_load(yaml_content) or {}

    # Merge with profile data
    report_data = merge_profile_data(report_data)

    # Create temporary directory and determine output filename
    temp_dir = tempfile.mkdtemp()
    project_name = report_data.get("project_info", {}).get("project_name", "project")
    safe_name = sanitize_filename(project_name)
    out_pdf = os.path.join(temp_dir, f"{safe_name}_report.pdf")

    # Generate PDF report
    pdf_path = generate_report_from_data(
        data=report_data,
        out_pdf=out_pdf,
        template_dir=TEMPLATE_DIR
    )
    
    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=f"{safe_name}_report.pdf",
        mimetype="application/pdf"
    )


@app.route("/check_figures", methods=["POST"])
def check_figures():
    """
    Check existence of required figure files based on YAML content.
    
    Analyzes the project configuration and returns a list of all required
    figures along with their existence status.
    
    Expects JSON payload with 'yaml_content' field containing YAML string.
    
    Returns:
        json: Dictionary with success status and list of figures
        tuple: Error response with status code if request is invalid
    """
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
            
            # Anchorage L clump figures
            if "anchorage" in category:
                l_clump_added = False
                for anchor in category["anchorage"]:
                    clump_type = anchor.get("clump_type", "")
                    
                    if clump_type in ["L Clump Top", "L Clump Front"] and not l_clump_added:
                        required_figures.extend(get_l_clump_figures(cat_idx))
                        l_clump_added = True
    
    # Check existence of all figures
    required_figures = check_figure_existence(required_figures)
    
    print(f"\nChecking {len(required_figures)} figures in: {INPUTS_DIR}")
    
    return jsonify({"success": True, "figures": required_figures})


@app.route("/input-helper.txt")
def input_helper():
    """
    Serve the input helper documentation file.
    
    Returns:
        file: Text file with figure naming guide
        tuple: Error response if file not found
    """
    helper_path = os.path.join(BASE_DIR, "input-helper.txt")
    
    if os.path.isfile(helper_path):
        return send_file(helper_path, mimetype="text/plain")
    else:
        return "Input helper file not found", 404


# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)
