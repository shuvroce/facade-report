from flask import Flask, render_template, request, redirect, url_for, flash, send_file
import yaml
import os
import subprocess

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Needed for flashing messages

# Path for saving YAML files
YAML_DIR = "yaml_files"
os.makedirs(YAML_DIR, exist_ok=True)

# -------------------- Helper Functions --------------------

def try_parse_number(value):
    """Convert string to int/float if possible."""
    try:
        if '.' in value:
            return float(value)
        return int(value)
    except:
        return value

def build_wind_data(form):
    """Build wind section from form data."""
    wind_keys = [
        'wind_speed','b_height','b_length','b_width','exposure_cat','occupancy_cat',
        'Imp_factor','K_d','K_h','K_ht','GC_pi','C_pl','q_zk','q_h','int_pressure',
        'leeward_pressure','sidewall_pressure','b_rigidity','b_freq','damping','gust_factor',
        'enclosure_type','roof_type','exposure_note','occupancy_note','location',
        'topography_type','topo_crest_side','topo_height','topo_length','topo_distance'
    ]
    wind_data = {}
    for key in wind_keys:
        if key in form:
            wind_data[key] = try_parse_number(form[key])
    return wind_data

def build_profiles(prefix, num, form):
    """Build aluminum or steel profiles from form data."""
    profiles = []
    for i in range(1, int(num)+1):
        profile = {}
        for key in form:
            if key.startswith(f"{prefix}_{i}_"):
                profile[key.replace(f"{prefix}_{i}_",'')] = try_parse_number(form[key])
        profiles.append(profile)
    return profiles

# -------------------- Routes --------------------

@app.route('/')
def index():
    return render_template('app.html')

@app.route('/generate_yaml', methods=['POST'])
def generate_yaml():
    form = request.form

    # -------------------- Validate required fields --------------------
    missing = [key for key in form if form[key].strip() == ""]
    if missing:
        flash(f"Please fill all required fields. Missing: {', '.join(missing)}")
        return redirect(url_for('index'))

    # -------------------- Build YAML data --------------------
    data = {
        "project_info": {
            "ref_no": form.get('ref_no'),
            "project_name": form.get('project_name'),
            "project_client": form.get('project_client'),
            "rev_no": form.get('rev_no'),
            "date": form.get('date')
        },
        "wind": build_wind_data(form),
        "alum_profiles": build_profiles('alum', form.get('num_alum', 0), form),
        "steel_profiles": build_profiles('steel', form.get('num_steel', 0), form),
        "categories": []  # Can be extended to parse nested categories if needed
    }

    yaml_path = os.path.join(YAML_DIR, "input.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(data, f, sort_keys=False)

    flash(f"YAML generated successfully at {yaml_path}")

    # -------------------- Call existing report.py --------------------
    try:
        subprocess.run(["python", "report.py"], check=True)
        pdf_path = "report.pdf"
        if os.path.exists(pdf_path):
            return send_file(pdf_path, as_attachment=True)
        else:
            flash("PDF not found after running report.py")
            return redirect(url_for('index'))
    except subprocess.CalledProcessError as e:
        flash(f"Error generating report: {e}")
        return redirect(url_for('index'))

# -------------------- Run Flask --------------------
if __name__ == "__main__":
    app.run(debug=True)
