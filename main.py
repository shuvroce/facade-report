import yaml
import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
import pikepdf

# PDF with Jinja2
with open("input.yaml", "r") as f:
    data = yaml.safe_load(f)

template_dir = os.path.join(os.path.dirname(__file__), "templates")

env = Environment(loader=FileSystemLoader(template_dir))
template = env.get_template("full-report.html")
html_out = template.render(data)

report_pdf = "report.pdf"

HTML(string=html_out, base_url=template_dir).write_pdf(
    report_pdf,
    stylesheets=[
        CSS(filename=os.path.join(template_dir, "assets/css/report.css"))
    ]
)


# Post-processing
def collapse_outlines(item):
    while item:
        if "/First" in item:
            item.Count = 0
            collapse_outlines(item.First)
        
        if "/Next" in item:
            item = item.Next
        else:
            break

with pikepdf.Pdf.open("report.pdf") as pdf:
    pdf.Root.PageMode = pikepdf.Name("/UseOutlines")
    pdf.Root.PageLayout = pikepdf.Name("/SinglePage")
    
    if "/Outlines" in pdf.Root and "/First" in pdf.Root.Outlines:
        pdf.Root.Outlines.Count = 0
        
        collapse_outlines(pdf.Root.Outlines.First)
    
    pdf.save("_report.pdf")

os.remove("report.pdf")
os.rename("_report.pdf", "report.pdf")

print("Report created successfully!")
