import os
import yaml
import tempfile
from flask import Flask, render_template, request, send_file, jsonify, session, send_from_directory
from jinja2 import Environment, FileSystemLoader
from report import generate_report_from_data, generate_summary_report_from_data, load_profile_data
from calc_helpers import (
    calc_steel_profile,
    calc_alum_profile,
    calc_glass_unit,
    calc_frame,
    calc_connection,
    calc_anchorage,
)
from wind_load import (
    compute_mwfrs_pressures,
    compute_cladding_pressures,
    parse_floor_heights,
    location_wind_speeds,
)

try:
    from tkinter import Tk
    from tkinter.filedialog import askdirectory

    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False

app = Flask(__name__)
app.secret_key = "facade_report_secret_key"

# Directory paths
BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
DEFAULT_INPUTS_DIR = os.path.join(TEMPLATE_DIR, "inputs")


# Get INPUTS_DIR from session or use default
def get_inputs_dir():
    return session.get("inputs_dir", DEFAULT_INPUTS_DIR)


def set_inputs_dir(directory):
    session["inputs_dir"] = directory


def render_preview_html(item_type, result, extra_context=None):
    context = {"result": result}
    if extra_context:
        context.update(extra_context)

    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

    macro_map = {
        "steel_profile": "{% from 'preview_partials.html' import steel_preview %}{{ steel_preview(result) }}",
        "alum_profile": "{% from 'preview_partials.html' import alum_preview %}{{ alum_preview(result) }}",
        "glass_unit": "{% from 'preview_partials.html' import glass_preview %}{{ glass_preview(result, glass_type) }}",
        "frame": "{% from 'preview_partials.html' import frame_preview %}{{ frame_preview(result) }}",
        "connection": "{% from 'preview_partials.html' import connection_preview %}{{ connection_preview(result) }}",
        "anchorage": "{% from 'preview_partials.html' import anchorage_preview %}{{ anchorage_preview(result) }}",
    }

    if item_type not in macro_map:
        return None

    tmpl = env.from_string(macro_map[item_type])
    return tmpl.render(**context)


# UTILITY FUNCTIONS
def sanitize_filename(name):
    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_"))
    return safe_name.strip().replace(" ", "_")

def _to_float(val, default=0.0):
    try:
        if val is None:
            return default
        return float(val)
    except (TypeError, ValueError):
        return default

def merge_profile_data(report_data):
    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
    if profile_data:
        merged = {}
        merged.update(profile_data)
        merged.update(report_data)
        return merged
    return report_data


# FIGURE CHECKING
def get_required_wind_figures(wind_data=None):
    if not wind_data:
        wind_data = {}

    if wind_data.get("auto_load") != "yes":
        return [
            {"name": "wind-location-map.png", "category": "Wind", "exists": False},
            {"name": "wind-mwfrs.png", "category": "Wind", "exists": False},
            {"name": "wind-cnc-wall.png", "category": "Wind", "exists": False},
            {"name": "wind-cnc-roof.png", "category": "Wind", "exists": False},
        ]
    else:
        return [{"name": "wind-location-map.png", "category": "Wind", "exists": False}]


def get_manual_profile_figures(profile_name):
    clean_name = profile_name.strip()
    figure_suffixes = [
        ".png",
        "-wp.png",
        "p.png",
        "-lb-web.png",
        "-lb-flange.png",
        "-lb-table.png",
        "-lb-web-cap.png",
        "-lb-flange-cap.png",
    ]

    return [
        {
            "name": f"{clean_name}{suffix}",
            "category": "Aluminum Profile",
            "exists": False,
        }
        for suffix in figure_suffixes
    ]


def get_sap_figures(category_index):
    sap_figure_names = [
        "sap-model.png",
        "sap-release.png",
        "sap-dead-load.png",
        "sap-wind-load.png",
        "sap-bmd.png",
        "sap-sfd.png",
        "sap-mul-max-moment.png",
        "sap-tran-max-moment.png",
        "sap-deformed-shape.png",
        "sap-mul-def.png",
        "sap-tran-def-wind.png",
        "sap-tran-def-dead.png",
        "sap-joint-force-dead.png",
        "sap-joint-force-wind.png",
        "sap-reaction-force-dead.png",
        "sap-reaction-force-wind.png",
    ]

    return [
        {
            "name": f"{category_index}-{fig}",
            "category": f"Category {category_index}",
            "exists": False,
        }
        for fig in sap_figure_names
    ]


def get_comp_profile_figures(category_index, mullion_name, steel_name=""):
    clean_mullion = mullion_name.strip()
    clean_steel = steel_name.strip()

    # Combine mullion and steel thickness for composite profile
    if clean_steel:
        # Extract thickness from RHS specification (e.g., "RHS 85x50x2.5" -> "2.5")
        steel_thickness = (
            clean_steel.split("x")[-1] if "x" in clean_steel else clean_steel
        )
        figure_name = f"{clean_mullion}+RHS {steel_thickness}.png"
    else:
        figure_name = f"{clean_mullion}.png"

    return [
        {"name": figure_name, "category": f"Category {category_index}", "exists": False}
    ]


def get_rfem_figures(category_index, glass_index):
    rfem_figure_names = [
        "rfem-model-3d.png",
        "rfem-model-data.png",
        "rfem-stress.png",
        "rfem-stress-ratio.png",
        "rfem-def.png",
        "rfem-def-ratio.png",
    ]

    return [
        {
            "name": f"{category_index}.{glass_index}-{fig}",
            "category": f"Category {category_index} - Glass {glass_index}",
            "exists": False,
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


# Serve assets from templates/assets folder
@app.route("/assets/<path:filename>")
def serve_assets(filename):
    assets_dir = os.path.join(TEMPLATE_DIR, "assets")
    return send_from_directory(assets_dir, filename)


# Figures
@app.route("/open_folder_picker", methods=["GET"])
def open_folder_picker():
    if not TKINTER_AVAILABLE:
        return {
            "success": False,
            "error": "Folder picker not available on this system",
        }, 400

    try:
        # Hide the tkinter root window
        root = Tk()
        root.withdraw()
        root.attributes("-topmost", True)

        # Open folder picker dialog
        selected_dir = askdirectory(title="Select Inputs Directory", mustexist=True)

        root.destroy()

        if not selected_dir:
            return {"success": False, "error": "No folder selected"}, 400

        # Validate directory exists
        if not os.path.isdir(selected_dir):
            return {
                "success": False,
                "error": f"Selected folder does not exist: {selected_dir}",
            }, 400

        # Set the directory in session
        set_inputs_dir(selected_dir)

        return {
            "success": True,
            "directory": selected_dir,
            "message": "Inputs directory set successfully",
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error opening folder picker: {str(e)}",
        }, 500


@app.route("/set_inputs_dir", methods=["POST"])
def set_inputs_directory():
    """Set the inputs directory from user selection"""
    if not request.json or "directory" not in request.json:
        return {"success": False, "error": "Missing directory path"}, 400

    directory = request.json["directory"]

    # Validate that the directory exists
    if not os.path.isdir(directory):
        return {
            "success": False,
            "error": f"Directory does not exist: {directory}",
        }, 400

    # Set the directory in session
    set_inputs_dir(directory)

    return {
        "success": True,
        "directory": directory,
        "message": "Inputs directory set successfully",
    }


@app.route("/get_inputs_dir", methods=["GET"])
def get_inputs_directory():
    """Get the current inputs directory"""
    current_dir = get_inputs_dir()
    return {
        "success": True,
        "directory": current_dir,
        "is_default": current_dir == DEFAULT_INPUTS_DIR,
    }


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
    wind_data = data.get("wind", {})
    required_figures.extend(get_required_wind_figures(wind_data))

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
            required_figures.append(
                {
                    "name": f"{cat_idx}-ref-elev.png",
                    "category": f"Category {cat_idx}",
                    "exists": False,
                }
            )

            # Glass RFEM figures (only for Point Fixed support type)
            if "glass_units" in category:
                for glass_idx, glass in enumerate(category["glass_units"], start=1):
                    support_type = glass.get("support_type", "")

                    if support_type == "Point Fixed":
                        required_figures.extend(get_rfem_figures(cat_idx, glass_idx))

            if "frames" in category:
                for frame in category["frames"]:
                    # SAP analysis figures
                    geometry = frame.get("geometry", "")
                    if geometry != "regular":
                        required_figures.extend(get_sap_figures(cat_idx))

                    # composite mullion figure
                    mullion_type = frame.get("mullion_type", "")
                    if mullion_type == "Aluminum + Steel":
                        mullion_name = frame.get("mullion", "")
                        steel_name = frame.get("steel", "")
                        if mullion_name:
                            required_figures.extend(
                                get_comp_profile_figures(
                                    cat_idx, mullion_name, steel_name
                                )
                            )

    # Check existence of all figures
    required_figures = check_figure_existence(required_figures)

    return jsonify({"success": True, "figures": required_figures})


# Input helper guide
@app.route("/input-helper")
def input_helper():
    return render_template("input-helper.html")


# Get profile names for dropdown
@app.route("/get_profile_names")
def get_profile_names():
    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)

    alum_profiles = []
    steel_profiles = []

    # Extract aluminum profile names
    if "alum_profiles_data" in profile_data:
        alum_profiles = [
            p.get("profile_name")
            for p in profile_data["alum_profiles_data"]
            if p.get("profile_name")
        ]

    # Extract steel profile names (if any)
    if "steel_profiles_data" in profile_data:
        steel_profiles = [
            p.get("profile_name")
            for p in profile_data["steel_profiles_data"]
            if p.get("profile_name")
        ]

    return jsonify({"alum_profiles": alum_profiles, "steel_profiles": steel_profiles})


@app.route("/get_profile_data")
def get_profile_data():
    profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
    return jsonify(profile_data)


@app.route("/save_manual_profile", methods=["POST"])
def save_manual_profile():
    """Save a manually calculated profile to man_profile.yaml"""
    payload = request.json or {}
    profile_type = payload.get("profile_type")  # "alum_profile" or "steel_profile"
    profile_data = payload.get("profile", {})
    
    if not profile_type or not profile_data:
        return {"success": False, "error": "Missing profile_type or profile data"}, 400
    
    try:
        man_profile_path = os.path.join(TEMPLATE_DIR, "assets", "man_profile.yaml")
        
        # Load existing manual profiles
        if os.path.exists(man_profile_path):
            with open(man_profile_path, "r", encoding="utf-8") as f:
                man_profiles = yaml.safe_load(f) or {}
        else:
            man_profiles = {"alum_profiles_data": [], "steel_profiles_data": []}
        
        # Determine which list to update
        if profile_type == "alum_profile":
            profile_list_key = "alum_profiles_data"
        elif profile_type == "steel_profile":
            profile_list_key = "steel_profiles_data"
        else:
            return {"success": False, "error": "Invalid profile_type"}, 400
        
        # Initialize list if not exists
        if profile_list_key not in man_profiles:
            man_profiles[profile_list_key] = []
        
        # Check if profile already exists and update, or add new
        profile_name = profile_data.get("profile_name")
        existing_index = None
        for i, p in enumerate(man_profiles[profile_list_key]):
            if p.get("profile_name") == profile_name:
                existing_index = i
                break
        
        if existing_index is not None:
            man_profiles[profile_list_key][existing_index] = profile_data
        else:
            man_profiles[profile_list_key].append(profile_data)
        
        # Write back to file
        with open(man_profile_path, "w", encoding="utf-8") as f:
            yaml.dump(man_profiles, f, default_flow_style=False, sort_keys=False)
        
        return {"success": True, "message": f"Profile '{profile_name}' saved successfully"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/get_wind_locations")
def get_wind_locations():
    """Return all available wind locations with their wind speeds."""
    return jsonify(
        {"locations": sorted(location_wind_speeds.items(), key=lambda x: x[0])}
    )


# Preview
@app.route("/calc_preview", methods=["POST"])
def calc_preview():
    payload = request.json or {}
    item_type = payload.get("item_type")
    item_data = payload.get("payload", {})

    try:
        extra_context = {}

        if item_type == "steel_profile":
            result = calc_steel_profile(item_data)
        elif item_type == "alum_profile":
            result = calc_alum_profile(item_data)
        elif item_type == "glass_unit":
            result = calc_glass_unit(item_data)
            extra_context["glass_type"] = item_data.get("glass_type", "sgu")
        elif item_type == "frame":
            # Frame needs profile data
            profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
            alum_data = profile_data.get("alum_profiles_data", profile_data.get("alum_profiles", []))
            steel_data = profile_data.get("steel_profiles_data", profile_data.get("steel_profiles", []))
            result = calc_frame(item_data, alum_data, steel_data)
        elif item_type == "connection":
            # Connection needs frame data
            frame_data = item_data.get("frame", {})
            result = calc_connection(item_data, frame_data)
        elif item_type == "anchorage":
            # Anchorage needs frame and profile data
            profile_data = load_profile_data(template_dir=TEMPLATE_DIR)
            alum_data = profile_data.get("alum_profiles_data", profile_data.get("alum_profiles", []))
            frame_data = item_data.get("frame", {})
            result = calc_anchorage(item_data, frame_data, alum_data)
        else:
            return {"success": False, "error": "Unsupported item type"}, 400
    except Exception as exc:  # guard against bad inputs
        return {"success": False, "error": str(exc)}, 400

    if not result:
        return {"success": False, "error": "Insufficient data"}, 400

    # Render HTML using Jinja templates
    try:
        html = render_preview_html(item_type, result, extra_context)
        if not html:
            return {
                "success": False,
                "error": "Unsupported item type or empty preview",
            }, 400
    except Exception as e:
        return {"success": False, "error": f"Rendering error: {str(e)}"}, 400

    return {"success": True, "html": html, "result": result}


@app.route("/wind_preview", methods=["POST"])
def wind_preview():
    payload = request.json or {}
    wind = payload.get("wind") or {}

    try:
        exposure_cat = str(wind.get("exposure_cat", "A")).upper()
        b_length = _to_float(wind.get("b_length"))
        b_width = _to_float(wind.get("b_width"))
        K_d = _to_float(wind.get("K_d"), 0.85)

        # Get wind speed from location if not provided
        wind_speed = _to_float(wind.get("wind_speed"))
        if not wind_speed or wind_speed == 0:
            location = wind.get("location", "")
            wind_speed = location_wind_speeds.get(location, 0)
            if not wind_speed:
                raise ValueError(
                    "Wind speed must be provided or location must be selected"
                )
        wind_speed = _to_float(wind_speed)
        GC_pi = _to_float(wind.get("GC_pi"), 0.18)
        b_freq = _to_float(wind.get("b_freq"), 1.2)
        damping = _to_float(wind.get("damping"), 0.02)
        floor_heights = wind.get("b_floor_heights")
        occupancy_cat = wind.get("occupancy_cat")

        topo_type = wind.get("topography_type", "Homogeneous")
        topo_height = _to_float(wind.get("topo_height"), 0.0)
        topo_length = _to_float(wind.get("topo_length"), 1.0)
        topo_distance = _to_float(wind.get("topo_distance"), 0.0)
        topo_side = wind.get("topo_crest_side", "Upwind")

        floors, _ = parse_floor_heights(floor_heights)

        summary, mwfrs_levels = compute_mwfrs_pressures(
            exposure_cat,
            b_length,
            b_width,
            K_d,
            wind_speed,
            occupancy_cat,
            GC_pi,
            topo_type,
            topo_height,
            topo_length,
            topo_distance,
            topo_side,
            floors,
            b_freq,
            damping,
        )

        wall_results, roof_results = compute_cladding_pressures(
            GC_pi,
            exposure_cat,
            topo_type,
            topo_height,
            topo_length,
            topo_distance,
            topo_side,
            floors,
            wind_speed,
            K_d,
            occupancy_cat,
        )

        area_keys = sorted(wall_results.keys())

    except Exception as exc:
        return {"success": False, "error": str(exc)}, 400

    mwfrs_rows = [
        {
            "Lvl": r["level"],
            "z": r["cumu_height"],
            "Kz": r["K_z"],
            "Kzt": r["K_zt"],
            "qz": r["q_z"],
            "P_wind": r["P_zw"],
        }
        for r in mwfrs_levels
    ]

    html_context = {
        "summary": summary,
        "mwfrs_rows": mwfrs_rows,
        "wall_rows_fmt": None,  # populated below
        "roof_rows_fmt": None,
    }

    wall_rows_fmt = []
    roof_rows_fmt = []

    for area in area_keys:
        wall_rows = wall_results.get(area) or []
        roof_rows = roof_results.get(area) or []

        if wall_rows:
            r = wall_rows[0]
            wall_rows_fmt.append(
                {
                    "A_eff": area,
                    "P_z4_pos": r.get("P_z4_pos"),
                    "P_z4_neg": r.get("P_z4_neg"),
                    "P_z5_pos": r.get("P_z5_pos"),
                    "P_z5_neg": r.get("P_z5_neg"),
                }
            )

        if roof_rows:
            r = roof_rows[0]
            roof_rows_fmt.append(
                {
                    "A_eff": area,
                    "P_z1_neg": r.get("P_z1_neg"),
                    "P_z2_neg": r.get("P_z2_neg"),
                    "P_z3_neg": r.get("P_z3_neg"),
                }
            )

    html_context["wall_rows_fmt"] = wall_rows_fmt
    html_context["roof_rows_fmt"] = roof_rows_fmt

    try:
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        template = env.get_template("preview_partials.html")
        html = template.module.wind_preview(**html_context)
    except Exception as exc:
        return {"success": False, "error": f"Rendering error: {str(exc)}"}, 500

    return {"success": True, "html": html}


# Report generation
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
        inputs_dir=get_inputs_dir(),
    )

    return send_file(
        pdf_path,
        as_attachment=True,
        download_name="report.pdf",
        mimetype="application/pdf",
    )


@app.route("/generate_summary_report", methods=["POST"])
def generate_summary_report():
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing yaml_content"}, 400

    # Parse YAML content
    yaml_content = request.json["yaml_content"]
    report_data = yaml.safe_load(yaml_content) or {}

    # Merge with profile data
    report_data = merge_profile_data(report_data)

    # Create temporary directory and determine output filename
    temp_dir = tempfile.mkdtemp()
    out_pdf = os.path.join(temp_dir, "summary.pdf")

    # Generate PDF report
    pdf_path = generate_summary_report_from_data(
        data=report_data,
        out_pdf=out_pdf,
        template_dir=TEMPLATE_DIR,
        inputs_dir=get_inputs_dir(),
    )

    return send_file(
        pdf_path,
        as_attachment=True,
        download_name="summary.pdf",
        mimetype="application/pdf",
    )


# APPLICATION ENTRY POINT
if __name__ == "__main__":
    # app.run(debug=True, port=5000)
    app.run(debug=True, host="0.0.0.0", port=5000)
