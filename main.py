import yaml
import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS

# --- Load YAML ---
with open("input.yaml", "r") as f:
    data = yaml.safe_load(f)

# Templates directory
template_dir = os.path.join(os.path.dirname(__file__), "templates")

# Jinja render
env = Environment(loader=FileSystemLoader(template_dir))
template = env.get_template("full-report.html")
html_out = template.render(data)

# Output file
report_pdf = "report.pdf"

# PDF generation with correct CSS loading
HTML(string=html_out, base_url=template_dir).write_pdf(
    report_pdf,
    stylesheets=[
        CSS(filename=os.path.join(template_dir, "assets/css/report.css"))
    ]
)


