import os
import yaml
import tempfile
from flask import Flask, request, send_file, render_template
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
import pikepdf
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask App
app = Flask(__name__, static_folder='static', template_folder='templates')

# --- PDF Generation Logic (Adapted from report.py) ---

def collapse_outlines(item):
    """Recursively collapses PDF outlines (table of contents) using Pikepdf."""
    while item:
        if "/First" in item:
            item.Count = 0
            collapse_outlines(item.First)

        if "/Next" in item:
            item = item.Next
        else:
            break

def generate_pdf_report(yaml_content, filename="report.pdf"):
    """
    Generates a PDF report from YAML data string.

    Args:
        yaml_content (str): The YAML data as a string.
        filename (str): The desired output filename for the PDF.

    Returns:
        str: The path to the temporary generated PDF file.
    """
    try:
        # 1. Load data from YAML content
        data = yaml.safe_load(yaml_content)
        if not data:
            data = {}

        # 2. Setup Jinja2 environment and render HTML
        template_dir = os.path.join(app.root_path, "templates")
        static_dir = os.path.join(app.root_path, "static")

        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("full-report.html")
        html_out = template.render(data=data) # Pass the parsed data dict

        # 3. Define output path for WeasyPrint
        # We use a temporary file to store the PDF before sending it
        temp_dir = tempfile.mkdtemp()
        report_pdf_path = os.path.join(temp_dir, filename)

        # 4. Configure WeasyPrint and generate PDF
        report_css_path = os.path.join(static_dir, "report.css")
        
        logging.info(f"Generating PDF at: {report_pdf_path}")
        logging.info(f"Using CSS file: {report_css_path}")
        
        HTML(
            string=html_out, 
            base_url=template_dir # Allows WeasyPrint to resolve relative paths in the HTML
        ).write_pdf(
            report_pdf_path,
            stylesheets=[CSS(filename=report_css_path)]
        )

        # 5. Post-processing with PikePDF
        with pikepdf.Pdf.open(report_pdf_path) as pdf:
            # Set document metadata
            pdf.docinfo["/Title"] = "Structural Calculation & Design Report"
            pdf.docinfo["/Author"] = "System Generator"
            
            # Collapse the outline (table of contents)
            if "/Outlines" in pdf.Root:
                if "/First" in pdf.Root.Outlines:
                    collapse_outlines(pdf.Root.Outlines.First)

            # Save the modified PDF back to the temporary file
            pdf.save(report_pdf_path)

        return report_pdf_path

    except Exception as e:
        logging.error(f"Error during PDF generation: {e}")
        # Clean up temporary directory if an error occurred before the file was returned
        if 'temp_dir' in locals() and os.path.exists(temp_dir):
            os.rmdir(temp_dir)
        raise e

# --- Flask Routes ---

@app.route("/")
def index():
    """Renders the main application HTML page."""
    # Assumes the updated app.html is renamed to index.html and placed in the templates folder
    return render_template("index.html")

@app.route("/generate_report", methods=["POST"])
def report():
    """API endpoint to receive YAML data and return the generated PDF file."""
    if not request.json or "yaml_content" not in request.json:
        return {"success": False, "error": "Missing YAML data in request body."}, 400

    yaml_content = request.json["yaml_content"]

    try:
        # 1. Generate the PDF and get the temporary path
        pdf_path = generate_pdf_report(yaml_content)

        # 2. Extract project name for a nice download filename
        yaml_data = yaml.safe_load(yaml_content)
        project_name = yaml_data.get('project_info', {}).get('project_name', 'project_data')
        # Clean the name for use as a filename
        clean_project_name = "".join(c for c in project_name if c.isalnum() or c in (' ', '_')).rstrip()
        download_filename = f"{clean_project_name.replace(' ', '_')}_report.pdf"

        # 3. Send the file and set up automatic cleanup (crucial!)
        return send_file(
            pdf_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=download_filename,
            # After the file is sent, the cleanup function will remove the temp file/dir
            max_age=0
        )
    except Exception as e:
        logging.error(f"Failed to generate or serve PDF: {e}")
        return {"success": False, "error": f"Internal server error: {e}"}, 500

if __name__ == "__main__":
    # Ensure the static and templates folders exist for development
    os.makedirs("templates", exist_ok=True)
    os.makedirs("static", exist_ok=True)
    
    app.run(debug=True)