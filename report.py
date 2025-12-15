import os
import yaml
import tempfile
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
import pikepdf

BASE_DIR = os.path.dirname(__file__)
INPUT_YAML = os.path.join(BASE_DIR, "input.yaml")
OUT_PDF = os.path.join(BASE_DIR, "report.pdf")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
PROFILE_YAML = os.path.join(TEMPLATE_DIR, "assets", "profile.yaml")
CSS_PATH = os.path.join(TEMPLATE_DIR, "assets", "css", "report.css")


def load_profile_data(profile_yaml_path=None, template_dir=None):
    if profile_yaml_path is None:
        base_template_dir = template_dir or TEMPLATE_DIR
        profile_yaml_path = os.path.join(base_template_dir, "assets", "profile.yaml")

    if not os.path.exists(profile_yaml_path):
        return {}

    with open(profile_yaml_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def collapse_outlines(item):
    while item:
        if "/First" in item:
            item.Count = 0
            collapse_outlines(item.First)
        if "/Next" in item:
            item = item.Next
        else:
            break

def generate_report_from_data(
    data,
    out_pdf=None,
    template_dir=None,
    css_path=None,
    inputs_dir=None,
    title="Structural Calculation & Design Report",
    author="Md. Akram Hossain",
):
    BASE_DIR = os.path.dirname(__file__)
    if template_dir is None:
        template_dir = os.path.join(BASE_DIR, "templates")
    if css_path is None:
        css_path = os.path.join(template_dir, "assets", "css", "report.css")
    if inputs_dir is None:
        inputs_dir = os.path.join(template_dir, "inputs")

    # If caller forgot to merge the shared profile data, pull it in here.
    if "alum_profiles_data" not in data:
        profile_data = load_profile_data(template_dir=template_dir)
        if profile_data:
            merged = {}
            merged.update(profile_data)
            merged.update(data)
            data = merged

    tmp_created = False
    if out_pdf is None:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", dir=BASE_DIR)
        out_pdf = tmp.name
        tmp.close()
        tmp_created = True

    try:
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("full-report.html")
        # Convert inputs_dir to file:// URI format for WeasyPrint
        inputs_uri = Path(inputs_dir).as_uri()
        data['inputs_dir'] = inputs_uri
        html_out = template.render(data)

        HTML(string=html_out, base_url=template_dir).write_pdf(
            out_pdf,
            stylesheets=[CSS(filename=css_path)]
        )

        # Allow overwriting input file so pikepdf can save back to same path
        with pikepdf.Pdf.open(out_pdf, allow_overwriting_input=True) as pdf:
            pdf.docinfo["/Title"] = title
            pdf.docinfo["/Author"] = author
            pdf.Root.PageMode = pikepdf.Name("/UseOutlines")
            pdf.Root.PageLayout = pikepdf.Name("/SinglePage")
            if "/Outlines" in pdf.Root and "/First" in pdf.Root.Outlines:
                pdf.Root.Outlines.Count = 0
                collapse_outlines(pdf.Root.Outlines.First)
            pdf.save(out_pdf)

        return out_pdf

    except Exception:
        if tmp_created and os.path.exists(out_pdf):
            os.remove(out_pdf)
        raise

def main():
    report_data = {}
    if os.path.exists(INPUT_YAML):
        with open(INPUT_YAML, "r", encoding="utf-8") as f:
            report_data = yaml.safe_load(f) or {}
    else:
        print(f"Warning: Missing main input file: {INPUT_YAML}")
    profile_data = load_profile_data()
    if profile_data:
        merged = {}
        merged.update(profile_data)
        merged.update(report_data)
        report_data = merged
    else:
        print(f"Info: Profile file not found: {PROFILE_YAML}. Skipping profile data.")

    out = generate_report_from_data(report_data, out_pdf=OUT_PDF)
    print(f"Report written to {out}")

if __name__ == "__main__":
    main()