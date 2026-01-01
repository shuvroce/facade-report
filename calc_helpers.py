import math
from typing import Dict, Optional, Any

STEEL_E = 210000  # MPa
STEEL_FY = 318    # MPa

def _to_float(value: Any) -> Optional[float]:
    try:
        v = float(value)
        return v
    except (TypeError, ValueError):
        return None


def calc_steel_profile(profile: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """Replicates the steel calculations from templates/profile.html."""
    web_length = _to_float(profile.get("web_length"))
    flange_length = _to_float(profile.get("flange_length"))
    thk = _to_float(profile.get("thk"))
    if not all([web_length, flange_length, thk]) or web_length <= 0 or flange_length <= 0 or thk <= 0:
        return None

    area = web_length * flange_length - ((web_length - 2 * thk) * (flange_length - 2 * thk))
    I_xx = (flange_length * web_length ** 3 / 12) - ((flange_length - 2 * thk) * (web_length - 2 * thk) ** 3) / 12
    I_yy = (web_length * flange_length ** 3 / 12) - ((web_length - 2 * thk) * (flange_length - 2 * thk) ** 3) / 12
    Y = web_length / 2
    X = flange_length / 2
    S_x = I_xx / Y
    S_y = I_yy / X
    Z_x = ((flange_length * web_length ** 2) - ((flange_length - 2 * thk) * (web_length - 2 * thk) ** 2)) / 4
    tor_constant = (2 * thk ** 2 * (flange_length - thk) ** 2 * (web_length - thk) ** 2) / (
        flange_length * thk + web_length * thk - 2 * (thk ** 2)
    )

    b = flange_length - 2 * thk
    h = web_length - 2 * thk
    lambda_f = b / thk
    lambda_p_f = 1.12 * math.sqrt(STEEL_E / STEEL_FY)
    lambda_r_f = 1.4 * math.sqrt(STEEL_E / STEEL_FY)
    lambda_w = h / thk
    lambda_p_w = 2.42 * math.sqrt(STEEL_E / STEEL_FY)
    lambda_r_w = 5.7 * math.sqrt(STEEL_E / STEEL_FY)

    Mn = (Z_x * STEEL_FY / 1_000_000)
    phi_Mn = 0.9 * Mn

    return {
        "area": round(area, 1),
        "I_xx": round(I_xx, 1),
        "I_yy": round(I_yy, 1),
        "Y": round(Y, 1),
        "X": round(X, 1),
        "S_x": round(S_x, 1),
        "S_y": round(S_y, 1),
        "Z_x": round(Z_x, 1),
        "tor_constant": round(tor_constant, 1),
        "lambda_f": round(lambda_f, 2),
        "lambda_p_f": round(lambda_p_f, 2),
        "lambda_r_f": round(lambda_r_f, 2),
        "lambda_w": round(lambda_w, 2),
        "lambda_p_w": round(lambda_p_w, 2),
        "lambda_r_w": round(lambda_r_w, 2),
        "Mn": round(Mn, 2),
        "phi_Mn": round(phi_Mn, 2),
    }


def calc_glass_unit(gu: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """Replicates the glass calculations from templates/glass.html for preview."""
    glass_type = gu.get("glass_type")
    if not glass_type:
        return None

    def _f(name: str) -> Optional[float]:
        return _to_float(gu.get(name))

    length = _f("length")
    width = _f("width")
    wind_load = _f("wind_load")
    support_type = gu.get("support_type")
    A_eff = max(length * width, length * length / 3) / 1000**2
    aspect_ratio = length / width
    if not length or not width or not wind_load:
        return None

    # Bite/glue values from template (may be unused in preview, kept for parity)
    bite_req = (wind_load * width) / (2 * 140)
    bite_pro = math.ceil(bite_req * 2) / 2
    glue_req = bite_req / 3
    glue_pro = max(6.0, math.ceil(glue_req * 2) / 2)

    if glass_type == "sgu" and length < 5000 and support_type != "Point Fixed":
        grade = gu.get("grade")
        gtf = 4.0 if grade == "FT" else 2.0 if grade == "HS" else 1.0
        nfl = _f("nfl")
        defl = _f("def")
        if not nfl or not defl:
            return None
        sgu_lr = nfl * gtf
        sgu_stress_ratio = wind_load / sgu_lr
        sgu_allow_def = width / 60
        sgu_def_ratio = defl / sgu_allow_def
        return {
            "branch": "sgu",
            "A_eff": round(A_eff, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "gtf": gtf,
            "sgu_lr": round(sgu_lr, 2),
            "stress_ratio": round(sgu_stress_ratio, 2),
            "def_ratio": round(sgu_def_ratio, 2),
            "allow_def": round(sgu_allow_def, 2),
            "deflection": round(defl, 2),
            "bite_req": round(bite_req, 2),
            "bite_pro": round(bite_pro, 2),
            "glue_req": round(glue_req, 2),
            "glue_pro": round(glue_pro, 2),
        }

    if glass_type == "dgu" and length < 5000 and support_type != "Point Fixed":
        gtf_table = {
            "AN": {"AN": (0.9, 0.9), "HS": (1.0, 1.9), "FT": (1.0, 3.8)},
            "HS": {"AN": (1.9, 1.0), "HS": (1.8, 1.8), "FT": (1.9, 3.8)},
            "FT": {"AN": (3.8, 1.0), "HS": (3.8, 1.9), "FT": (3.6, 3.6)},
        }
        grade1, grade2 = gu.get("grade1"), gu.get("grade2")
        t1 = _f("thickness1")
        t2 = _f("thickness2")
        nfl1 = _f("nfl1")
        nfl2 = _f("nfl2")
        def1 = _f("def1")
        def2 = _f("def2")
        if None in (t1, t2, nfl1, nfl2, def1, def2):
            return None
        dgu_ls1 = (t1 ** 3 + t2 ** 3) / (t1 ** 3)
        dgu_ls2 = (t1 ** 3 + t2 ** 3) / (t2 ** 3)
        gtf1 = gtf_table.get(grade1, {}).get(grade2, (1.0, 1.0))[0]
        gtf2 = gtf_table.get(grade1, {}).get(grade2, (1.0, 1.0))[1]
        dgu_lr1 = nfl1 * gtf1 * dgu_ls1
        dgu_lr2 = nfl2 * gtf2 * dgu_ls2
        dgu_lr = min(dgu_lr1, dgu_lr2)
        dgu_stress_ratio = wind_load / dgu_lr if dgu_lr else None
        dgu_def = max(def1, def2)
        dgu_allow_def = width / 90
        dgu_def_ratio = dgu_def / dgu_allow_def if dgu_allow_def else None
        if dgu_stress_ratio is None or dgu_def_ratio is None:
            return None
        return {
            "branch": "dgu",
            "A_eff": round(A_eff, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "gtf1": gtf1,
            "gtf2": gtf2,
            "dgu_ls1": round(dgu_ls1, 2),
            "dgu_ls2": round(dgu_ls2, 2),
            "dgu_lr1": round(dgu_lr1, 2),
            "dgu_lr2": round(dgu_lr2, 2),
            "stress_ratio": round(dgu_stress_ratio, 2),
            "def_ratio": round(dgu_def_ratio, 2),
            "allow_def": round(dgu_allow_def, 2),
            "deflection1": round(def1, 2),
            "deflection2": round(def1, 2),
            "deflection": round(dgu_def, 2),
            "bite_req": round(bite_req, 2),
            "bite_pro": round(bite_pro, 2),
            "glue_req": round(glue_req, 2),
            "glue_pro": round(glue_pro, 2),
        }

    if glass_type == "lgu" and length < 5000 and support_type != "Point Fixed":
        grade = gu.get("grade")
        gtf = 4.0 if grade == "FT" else 2.0 if grade == "HS" else 1.0
        nfl = _f("nfl")
        defl = _f("def")
        if not nfl or not defl:
            return None
        lgu_lr = nfl * gtf
        lgu_stress_ratio = wind_load / lgu_lr
        lgu_allow_def = width / 60
        lgu_def_ratio = defl / lgu_allow_def
        return {
            "branch": "lgu",
            "A_eff": round(A_eff, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "gtf": gtf,
            "lgu_lr": round(lgu_lr, 2),
            "stress_ratio": round(lgu_stress_ratio, 2),
            "def_ratio": round(lgu_def_ratio, 2),
            "allow_def": round(lgu_allow_def, 2),
            "deflection": round(defl, 2),
            "bite_req": round(bite_req, 2),
            "bite_pro": round(bite_pro, 2),
            "glue_req": round(glue_req, 2),
            "glue_pro": round(glue_pro, 2),
        }

    if glass_type == "ldgu" and length < 5000 and support_type != "Point Fixed":
        gtf_table = {
            "AN": {"AN": (0.9, 0.9), "HS": (1.0, 1.9), "FT": (1.0, 3.8)},
            "HS": {"AN": (1.9, 1.0), "HS": (1.8, 1.8), "FT": (1.9, 3.8)},
            "FT": {"AN": (3.8, 1.0), "HS": (3.8, 1.9), "FT": (3.6, 3.6)},
        }
        grade1, grade2 = gu.get("grade1"), gu.get("grade2")
        t1_1 = _f("thickness1_1")
        t1_2 = _f("thickness1_2")
        t2 = _f("thickness2")
        nfl1 = _f("nfl1")
        nfl2 = _f("nfl2")
        def1 = _f("def1")
        def2 = _f("def2")
        if None in (t1_1, t1_2, t2, nfl1, nfl2, def1, def2):
            return None
        ldgu_thickness1 = t1_1 + t1_2
        ldgu_ls1 = (ldgu_thickness1 ** 3 + t2 ** 3) / (ldgu_thickness1 ** 3)
        ldgu_ls2 = (ldgu_thickness1 ** 3 + t2 ** 3) / (t2 ** 3)
        gtf1 = gtf_table.get(grade1, {}).get(grade2, (1.0, 1.0))[0]
        gtf2 = gtf_table.get(grade1, {}).get(grade2, (1.0, 1.0))[1]
        ldgu_lr1 = nfl1 * gtf1 * ldgu_ls1
        ldgu_lr2 = nfl2 * gtf2 * ldgu_ls2
        ldgu_lr = min(ldgu_lr1, ldgu_lr2)
        ldgu_stress_ratio = wind_load / ldgu_lr if ldgu_lr else None
        ldgu_def = max(def1, def2)
        ldgu_allow_def = width / 90
        ldgu_def_ratio = ldgu_def / ldgu_allow_def if ldgu_allow_def else None
        if ldgu_stress_ratio is None or ldgu_def_ratio is None:
            return None
        return {
            "branch": "ldgu",
            "A_eff": round(A_eff, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "gtf1": gtf1,
            "gtf2": gtf2,
            "ldgu_ls1": round(ldgu_ls1, 2),
            "ldgu_ls2": round(ldgu_ls2, 2),
            "ldgu_lr1": round(ldgu_lr1, 2),
            "ldgu_lr2": round(ldgu_lr2, 2),
            "stress_ratio": round(ldgu_stress_ratio, 3),
            "def_ratio": round(ldgu_def_ratio, 3),
            "allow_def": round(ldgu_allow_def, 2),
            "deflection1": round(def1, 2),
            "deflection2": round(def2, 2),
            "deflection": round(ldgu_def, 2),
            "bite_req": round(bite_req, 2),
            "bite_pro": round(bite_pro, 2),
            "glue_req": round(glue_req, 2),
            "glue_pro": round(glue_pro, 2),
        }

    return {"branch": "rfem", "note": "Point fixed or span >= 5000"}


def calc_frame(frame: Dict[str, Any], glass_thk: float = 0, alum_profiles_data: list = None, steel_profiles: list = None) -> Optional[Dict[str, Any]]:
    """Replicates frame calculations from templates/frame.html for preview."""
    if not frame or alum_profiles_data is None:
        return None

    alum_profiles_data = alum_profiles_data or []
    steel_profiles = steel_profiles or []

    # Resolve profile references
    def find_profile(name: str, data_list: list) -> Optional[Dict]:
        if not name:
            return None
        for p in data_list:
            if p.get("profile_name") == name or p.get("profile_name", "").strip() == name.strip():
                return p
        return None

    mullion = frame.get("mullion")
    transom = frame.get("transom")
    steel_ref = frame.get("steel")

    mullion_profile = find_profile(mullion, alum_profiles_data) if mullion else None
    transom_profile = find_profile(transom, alum_profiles_data) if transom else None
    steel_profile = find_profile(steel_ref, steel_profiles) if steel_ref else None

    # Extract dimensions
    frame_width = _to_float(frame.get("width"))
    frame_length = _to_float(frame.get("length"))
    wind_neg = _to_float(frame.get("wind_neg"))
    tran_spacing = _to_float(frame.get("tran_spacing"))
    mullion_type = frame.get("mullion_type", "Aluminum Only")
    frame_type = frame.get("frame_type", "Continuous")
    glass_thk = _to_float(frame.get("glass_thickness")) or glass_thk or 0

    if not all([frame_width, frame_length, wind_neg]):
        return None

    # Mullion loads
    mul_w_dead = (glass_thk * 0.025 * frame_width / 1000)
    mul_w_wind = (wind_neg * frame_width / 1000)
    mul_mu = round(1.6 * mul_w_wind * (frame_length / 1000) ** 2 / 8, 2)

    # Transom loads
    if tran_spacing != frame_length and frame_type != "Floor-to-floor":
        tran_w_dead = (glass_thk * 0.025) * (frame_width / 1000)
        tran_w_wind = wind_neg * (frame_width / 1000)
    else:
        tran_w_dead = ((glass_thk * 0.025) / 2) * (frame_width / 1000)
        tran_w_wind = (wind_neg / 2) * (frame_width / 1000)

    tran_mu = round(1.6 * tran_w_wind * (frame_width / 1000) ** 2 / 12, 2)

    # Deflection limits
    if frame_length <= 4100:
        mul_allow_def = frame_length / 175
    else:
        mul_allow_def = (frame_length / 240) + 6.35
    tran_allow_def = frame_width / 175

    # Section properties
    if mullion_type == "Aluminum + Steel":
        mul_Ix_a = mullion_profile.get("I_xx", 0) if mullion_profile else 0
        mul_phi_Mn_a = mullion_profile.get("phi_Mn", 0) if mullion_profile else 0

        # Steel moment of inertia
        if steel_profile:
            sp_web = _to_float(steel_profile.get("web_length")) or 0
            sp_flange = _to_float(steel_profile.get("flange_length")) or 0
            sp_thk = _to_float(steel_profile.get("thk")) or 0
            sp_I_xx = ((sp_flange * sp_web ** 3 / 12) - ((sp_flange - 2 * sp_thk) * (sp_web - 2 * sp_thk) ** 3) / 12)
            sp_Z_x = (((sp_flange * sp_web ** 2) - ((sp_flange - 2 * sp_thk) * (sp_web - 2 * sp_thk) ** 2)) / 4)
            mul_phi_Mn_s = round(0.9 * (sp_Z_x * STEEL_FY / 1_000_000), 2)
        else:
            sp_I_xx = 0
            mul_phi_Mn_s = 0

        mul_Ix = mul_Ix_a + 3 * sp_I_xx
        ls_a = mul_Ix_a / mul_Ix if mul_Ix else 0
        ls_s = 1 - ls_a
        
        mul_mu_a = mul_mu * ls_a
        mul_mu_s = mul_mu * ls_s
        mul_dc_a = round(mul_mu_a / mul_phi_Mn_a, 2) if mul_phi_Mn_a else None
        mul_dc_s = round(mul_mu_s / mul_phi_Mn_s, 2) if mul_phi_Mn_s else None
    else:
        mul_Ix = mullion_profile.get("I_xx", 0) if mullion_profile else 0
        mul_phi_Mn = mullion_profile.get("phi_Mn", 0) if mullion_profile else 0
        mul_dc = round(mul_mu / mul_phi_Mn, 2) if mul_phi_Mn else None
        mul_dc_a = None
        mul_dc_s = None

    if frame_type == "Floor-to-floor":
        mul_def = (5 * 0.7 * mul_w_wind * frame_length**4) / (384 * 70000 * mul_Ix)
    elif frame_type == "Continuous":
        mul_def = (0.7 * mul_w_wind * frame_length**4) / (185 * 70000 * mul_Ix)
    
    tran_Ix = transom_profile.get("I_xx", 0) if transom_profile else 0
    tran_Iy = transom_profile.get("I_yy", 0) if transom_profile else 0
    tran_phi_Mn = transom_profile.get("phi_Mn", 0) if transom_profile else 0
    tran_dc = round(tran_mu / tran_phi_Mn, 2) if tran_phi_Mn else None
    tran_def_wind = (5 * 0.7 * tran_w_wind * frame_width**4) / (384 * 70000 * tran_Ix)
    tran_def_dead = (5 * 0.7 * tran_w_dead * frame_width**4) / (384 * 70000 * tran_Iy)

    return {
        "frame_type": frame_type,
        "mullion_type": mullion_type,
        "mul_w_wind": round(mul_w_wind, 2),
        "mul_w_dead": round(mul_w_dead, 2),
        "mul_mu": mul_mu,
        "tran_mu": tran_mu,
        "mul_phi_Mn": mul_phi_Mn if mullion_type != "Aluminum + Steel" else None,
        "mul_phi_Mn_a": mul_phi_Mn_a if mullion_type == "Aluminum + Steel" else None,
        "mul_phi_Mn_s": mul_phi_Mn_s if mullion_type == "Aluminum + Steel" else None,
        "mul_dc": mul_dc if mullion_type != "Aluminum + Steel" else None,
        "mul_dc_a": mul_dc_a if mullion_type == "Aluminum + Steel" else None,
        "mul_dc_s": mul_dc_s if mullion_type == "Aluminum + Steel" else None,
        "mul_def": round(mul_def, 2),
        "mul_allow_def": round(mul_allow_def, 2),
        "tran_phi_Mn": tran_phi_Mn,
        "tran_dc": tran_dc,
        "tran_def_wind": round(tran_def_wind, 2),
        "tran_def_dead": round(tran_def_dead, 2),
        "tran_allow_def": round(tran_allow_def, 2),
    }


def calc_connection(conn: Dict[str, Any], frame: Dict[str, Any], glass_thk: float = 0, alum_profiles_data: list = None) -> Optional[Dict[str, Any]]:
    """Replicates connection calculations from templates/connection.html for preview."""
    if not conn or not frame:
        return None

    alum_profiles_data = alum_profiles_data or []

    # Get frame loads (from frame calculation or direct)
    frame_width = _to_float(frame.get("width")) or 0
    frame_type = frame.get("frame_type", "Continuous")
    wind_neg = _to_float(frame.get("wind_neg")) or 0
    glass_thk = _to_float(frame.get("glass_thickness")) or glass_thk or 0

    mul_w_dead = (glass_thk * 0.025 * frame_width / 1000)
    mul_w_wind = (wind_neg * frame_width / 1000)

    # Transom loads
    tran_spacing = _to_float(frame.get("tran_spacing")) or frame_width
    if tran_spacing != frame_width and frame_type != "Floor-to-floor":
        tran_w_dead = (glass_thk * 0.025) * (frame_width / 1000)
        tran_w_wind = wind_neg * (frame_width / 1000)
    else:
        tran_w_dead = ((glass_thk * 0.025) / 2) * (frame_width / 1000)
        tran_w_wind = (wind_neg / 2) * (frame_width / 1000)

    joint_fy = round(((tran_w_wind * frame_width / 1000) / 4), 2)
    joint_fz = round(((tran_w_dead * frame_width / 1000) / 4), 2)

    design_fy = joint_fy * 1.6
    design_fz = joint_fz * 1.4

    screw_nos = _to_float(conn.get("screw_nos")) or 0
    screw_dia = _to_float(conn.get("screw_dia")) or 0
    head_dia = _to_float(conn.get("head_dia")) or 0
    t1 = _to_float(conn.get("t1")) or 0
    t2 = _to_float(conn.get("t2")) or 0
    tc = _to_float(conn.get("tc")) or 0

    if not all([screw_nos, screw_dia, head_dia, t1, t2, tc]):
        return None

    # Screw shear capacity
    R_yB = design_fy / (screw_nos / 2)
    R_zB = design_fz / (screw_nos / 2)
    resultant_shear = round((R_yB ** 2 + R_zB ** 2) ** 0.5, 2)

    # Pull-over (tilting)
    Pnv1 = 4.2 * (t2 ** 3 * screw_dia) ** 0.5 * 207
    Pnv2 = 2.7 * (t1 * screw_dia) * 207
    Pnv3 = 2.7 * (t2 * screw_dia) * 207
    phi_Pnv = round(0.5 * min(Pnv1, Pnv2, Pnv3) / 1000, 2)

    # Pull-out
    phi_Pnot = round(0.5 * 0.85 * tc * screw_dia * 207 / 1000, 2)

    # Pull-over tension
    d_w = min(head_dia, 19.1)
    phi_Pnov = round(0.5 * 1.5 * t1 * d_w * 207 / 1000, 2)

    # Ratios
    shear_ratio = round(resultant_shear / phi_Pnv, 2) if phi_Pnv else None
    pullout_ratio = round(design_fz / phi_Pnot, 2) if phi_Pnot else None
    pullover_ratio = round(design_fz / phi_Pnov, 2) if phi_Pnov else None

    return {
        "screw_nos": int(screw_nos),
        "screw_dia": screw_dia,
        "resultant_shear": resultant_shear,
        "phi_Pnv": phi_Pnv,
        "shear_ratio": shear_ratio,
        "phi_Pnot": phi_Pnot,
        "pullout_ratio": pullout_ratio,
        "phi_Pnov": phi_Pnov,
        "pullover_ratio": pullover_ratio,
    }


def calc_anchorage(anchor: Dict[str, Any], frame: Dict[str, Any], glass_thk: float = 0, alum_profiles_data: list = None) -> Optional[Dict[str, Any]]:
    """Replicates anchorage calculations from templates/anchorage.html for preview."""
    if not anchor or not frame:
        return None

    alum_profiles_data = alum_profiles_data or []

    # Get frame loads
    frame_width = _to_float(frame.get("width")) or 0
    frame_length = _to_float(frame.get("length")) or 0
    frame_type = frame.get("frame_type", "Continuous")
    wind_neg = _to_float(frame.get("wind_neg")) or 0
    glass_thk = _to_float(frame.get("glass_thickness")) or glass_thk or 0

    mul_w_dead = (glass_thk * 0.025 * frame_width / 1000)
    mul_w_wind = (wind_neg * frame_width / 1000)

    if frame_type == "Floor-to-floor":
        mul_vu = round(1.6 * mul_w_wind * (frame_length / 1000) / 2, 2)
        reaction_Rz = round(mul_w_dead / 2, 2)
    else:  # Continuous
        mul_vu = round(1.6 * mul_w_wind * (frame_length / 1000) * (5 / 8), 2)
        reaction_Rz = round(mul_w_dead, 2)

    reaction_Ry = mul_vu

    clump_type = anchor.get("clump_type", "Box Clump")
    anchor_dia = _to_float(anchor.get("anchor_dia"))
    anchor_nos = _to_float(anchor.get("anchor_nos")) or 1
    embed_depth = _to_float(anchor.get("embed_depth")) or 0
    C_a1 = _to_float(anchor.get("C_a1")) or 0

    if not anchor_dia or not embed_depth:
        return None

    # Anchor stress area based on diameter
    A_seN_map = {10: 58.0, 12: 84.3, 16: 156.7}
    A_seN = A_seN_map.get(int(anchor_dia), 58.0)

    # Nominal tension capacity
    phi_Nsa = round(0.75 * A_seN * 500 / 1000, 2)

    # Breakout area and pullout
    A_NCO = 9 * embed_depth ** 2
    psi_edN = min(0.7 + (0.3 * C_a1) / (1.5 * embed_depth), 1.0)
    N_b = 7 * (27.5 ** 0.5) * (embed_depth ** 1.5) / 1000
    phi_Ncbg = round(0.65 * (9 * embed_depth ** 2 / A_NCO) * psi_edN * N_b, 2)

    design_Ry = reaction_Ry * 1.6
    design_Rz = reaction_Rz * 1.4

    N_ua = design_Ry / anchor_nos if anchor_nos else 0
    N_ug = N_ua * anchor_nos

    return {
        "clump_type": clump_type,
        "anchor_dia": anchor_dia,
        "anchor_nos": int(anchor_nos),
        "reaction_Ry": reaction_Ry,
        "reaction_Rz": reaction_Rz,
        "N_ua": round(N_ua, 2),
        "N_ug": round(N_ug, 2),
        "phi_Nsa": phi_Nsa,
        "phi_Ncbg": phi_Ncbg,
        "ratio_Nsa": round(N_ua / phi_Nsa, 2) if phi_Nsa else None,
        "ratio_Ncbg": round(N_ug / phi_Ncbg, 2) if phi_Ncbg else None,
    }
