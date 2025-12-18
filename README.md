# Facade Report Generator

A Flask-based application to generate structural calculation and design reports for building façades. It provides a modern web UI to compose inputs, validates required figure files, and renders a polished PDF using Jinja2 templates and WeasyPrint, with final metadata tweaks via pikepdf.

## Features

- Dynamic form UI to build YAML inputs for project, profiles, wind, categories
- One-click PDF generation with consistent styling and layout
- Figure requirements checker with per-file status and summary
- Configurable inputs directory (via UI folder picker or API)
- Jinja2 templating with modular sections and partials
- CLI mode to render from an `input.yaml`

## Tech Stack

- Backend: Flask
- Templating: Jinja2
- PDF Rendering: WeasyPrint (HTML/CSS to PDF)
- PDF Post-processing: pikepdf
- Frontend: Vanilla JS/CSS (see `static/`)

## Project Structure

```
app.py                      # Flask app (routes, figure checks, inputs-dir management)
report.py                   # Rendering pipeline (Jinja2 + WeasyPrint + pikepdf)
static/
	app.css, app.js         # UI styles and logic
templates/
	index.html              # Main UI
	full-report.html        # Master report template
	assets/                 # Profile YAML, CSS, fonts, images
	partials/               # Template partials for sections
	common/                 # Common sections (cover, header, intro, toc, reference)
	inputs/                 # Default folder for user-provided figure files (configurable)
    input-helper.html       # Local guide describing expected inputs/figures
```

## Prerequisites

- Python 3.10+ recommended
- Windows, macOS, or Linux
- WeasyPrint may require system libraries (Cairo/Pango) depending on platform. If you hit rendering issues, consult WeasyPrint’s installation docs for your OS.

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate    # On macOS/Linux: source .venv/bin/activate
pip install -r requirement.txt
```

## Run the App

```bash
python app.py
```

Then open http://localhost:5000 in your browser.

## Usage (Web UI)

1. Build inputs in the General, Profiles, Wind, and Categories tabs.
2. Use YAML actions (Load / Generate / Download) as needed. The YAML view reflects the form.
3. Configure Inputs Directory:
	 - Click the pencil button near “Figures” to set a folder for figure images.
	 - By default, the app uses `templates/inputs`.
4. Check Figures:
	 - Click the refresh icon to validate required images for the current YAML.
	 - The status panel lists each expected file and whether it exists.
5. Create Report:
	 - Click “Create Report” to render and download `report.pdf`.

Tip: The “?” button opens the input guide. You can also view it at [/input-helper.html](http://localhost:5000/input-helper.html) when the server is running.

## Inputs & Figures

The app expects specific figure files based on your YAML:

- Always required (Wind): `wind-location-map.png`, `wind-mwfrs.png`, `wind-cnc-wall.png`, `wind-cnc-roof.png`
- Manual aluminum profile (if selected): multiple images derived from the profile name, e.g. `MyProfile.png`, `MyProfile-wp.png`, `MyProfilep.png`, etc.
- Per category: `N-ref-elev.png` (where N is the category index)
- SAP analysis (per category): a set of `N-sap-*.png` images (model, releases, loads, BMD/SFD, deflections, etc.)
- RFEM glass (only when support_type is “Point Fixed”): images prefixed with `N.M-` (category N, glass M)
- Composite profile (Aluminum + Steel): an image named after the mullion, e.g. `RHS 85x50x2.5.png`

Use the figure checker to see the exact list derived from your current YAML. Place these images into your configured Inputs Directory.

## API Reference

- `GET /` — Serve the main UI
- `POST /generate_report` — Generate and return a PDF
	- JSON body: `{ "yaml_content": "...yaml text..." }`
	- Returns: `application/pdf` attachment
- `POST /check_figures` — Compute required figures for the YAML and check file existence
	- JSON body: `{ "yaml_content": "...yaml text..." }`
	- Returns: `{ success, figures: [{ name, category, exists }] }`
- `POST /set_inputs_dir` — Set the inputs directory path used for figures
	- JSON body: `{ "directory": "absolute/path/to/images" }`
- `GET /get_inputs_dir` — Get the current inputs directory and whether the default is used
- `GET /open_folder_picker` — Open native folder picker (only if Tkinter is available on the host)
- `GET /input-helper.html` — Local guide for inputs and figures
- `GET /input-helper.txt` — Plain-text version of the guide

### Example: Generate Report via `curl`

```bash
curl -X POST http://localhost:5000/generate_report \
	-H "Content-Type: application/json" \
	-d @- \
	--output report.pdf <<'JSON'
{
	"yaml_content": "project_info:\n  project_name: Example\n"
}
JSON
```

## CLI Mode

You can also generate a report without the web UI:

```bash
# Place your YAML as input.yaml at the repo root
python report.py
# Output: report.pdf in the repo root
```

`report.py` automatically merges shared profile data from `templates/assets/profile.yaml` and applies `templates/assets/css/report.css` during rendering.

## Troubleshooting

- WeasyPrint errors: ensure required system libraries (Cairo/Pango) are available for your OS, or use the official WeasyPrint wheels where applicable.
- Missing figures: use the checker panel or `/check_figures` to see exact filenames and place them in the configured inputs directory.
- Folder picker not available: `/open_folder_picker` needs Tkinter; set the directory via the UI input or `/set_inputs_dir` instead.

