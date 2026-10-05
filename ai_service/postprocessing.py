import cv2
import base64
import numpy as np
import datetime
from config import WASTE_METADATA, MODEL_FULL_NAME

# Rich metadata for each class
DETAILED_METADATA = {
    'Syringes': {
        'category': 'Sharps Waste', 'riskLevel': 'High',
        'disposalMethod': 'Autoclaving & Shredding', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None (Regulated Sharps)',
        'impact': 'High risk of needle stick injuries and bloodborne pathogens (HBV, HCV, HIV).',
        'compliance': 'Dispose in puncture-proof sharps container. Do not recap. Seal container at 3/4 full capacity.',
        'overview': 'Single-use hypodermic syringe barrel and plunger. Regulated as clinical sharps waste requiring immediate point-of-use segregation.',
        'hazardIndex': 78, 'infectionVector': 'Percutaneous bloodborne pathogen transmission',
        'carbonFootprintKg': 0.048, 'landfillPersistenceYears': 450,
        'materialComposition': [
            {'material': 'Medical Polypropylene (PP)', 'percentage': 68, 'color': '#3b82f6'},
            {'material': 'Polyethylene Plunger Core', 'percentage': 22, 'color': '#60a5fa'},
            {'material': 'Silicone Lubricant / Residual Fluids', 'percentage': 10, 'color': '#f59e0b'}
        ],
        'whoProtocol': ['Do not attempt to recap, detach, or bend needle with hands.', 'Drop syringe directly into yellow puncture-resistant sharps container.', 'Autoclave at 121°C for 30 min before secondary mechanical shredding.'],
        'requiredPPE': ['Nitrile Examination Gloves', 'Puncture-Resistant Heavy Apron', 'Face Shield'],
        'audioAlert': 'Warning: Sharps medical syringe detected. Dispose immediately in rigid puncture-proof yellow container.'
    },
    'Syringe Needles': {
        'category': 'Sharps Waste', 'riskLevel': 'Critical',
        'disposalMethod': 'Puncture-Proof Containment followed by Encapsulation', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None (Biohazard Sharps)',
        'impact': 'Extreme sharp laceration hazard and high-risk transmission of bloodborne viruses.',
        'compliance': 'Dispose immediately in rigid puncture-proof sharps boxes. Never recap or hand-pass needles.',
        'overview': 'Exposed surgical/hypodermic stainless steel cannula. Highest percutaneous occupational transmission risk for healthcare workers.',
        'hazardIndex': 96, 'infectionVector': 'Direct subcutaneous inoculation of HBV, HCV, and HIV',
        'carbonFootprintKg': 0.035, 'landfillPersistenceYears': 120,
        'materialComposition': [
            {'material': 'AISI 304 Surgical Stainless Steel', 'percentage': 76, 'color': '#64748b'},
            {'material': 'Polypropylene Luer-Lok Hub', 'percentage': 16, 'color': '#3b82f6'},
            {'material': 'Blood / Biological Fluid Contaminant', 'percentage': 8, 'color': '#ef4444'}
        ],
        'whoProtocol': ['Use needle destroyer/cutter immediately at bedside.', 'Never recap, bend, or manipulate exposed needle manually.', 'Rigid sharps container must be sealed and autoclaved when 75% full.'],
        'requiredPPE': ['Double Nitrile Gloves', 'Cut-Resistant Under-Gloves', 'Safety Goggles'],
        'audioAlert': 'Critical Alert: Exposed needle detected. Extreme puncture hazard. Deposit in rigid sharps box now.'
    },
    'Gloves': {
        'category': 'Infectious Waste', 'riskLevel': 'Medium',
        'disposalMethod': 'Chemical Disinfection & Controlled Incineration', 'colorBin': 'Red Category',
        'rec': 'No', 'recyclingMethod': 'None (Infectious Biological Vector)',
        'impact': 'Vector for biological contamination and hospital-acquired infections (HAIs).',
        'compliance': 'Segregate immediately into red biohazard clinical waste bags.',
        'overview': 'Clinical protective nitrile or latex gloves soiled during clinical procedures. High surface area for contact-borne pathogen transmission.',
        'hazardIndex': 62, 'infectionVector': 'Contact pathogen transfer, MRSA, C. difficile spores',
        'carbonFootprintKg': 0.062, 'landfillPersistenceYears': 100,
        'materialComposition': [
            {'material': 'Synthetic Nitrile / Natural Latex Rubber', 'percentage': 88, 'color': '#ef4444'},
            {'material': 'Zinc Oxide Accelerators & Coatings', 'percentage': 7, 'color': '#cbd5e1'},
            {'material': 'Bio-Fluid Surface Pathogen Load', 'percentage': 5, 'color': '#f97316'}
        ],
        'whoProtocol': ['Peel off inside out to contain pathogens on exterior surface.', 'Discard directly into Red Category infectious waste bin.', 'Sanitize hands with 70% alcohol handrub immediately following glove removal.'],
        'requiredPPE': ['Clean Replacement Exam Gloves', 'Clinical Hand Hygiene Protocol'],
        'audioAlert': 'Infectious clinical gloves detected. Route to Red Category infectious biohazard bin.'
    },
    'Masks': {
        'category': 'General Waste', 'riskLevel': 'Low',
        'disposalMethod': 'Controlled Landfill / Municipal Waste', 'colorBin': 'Black Category',
        'rec': 'Partial', 'recyclingMethod': 'Polypropylene Melt Blown Pelletizing (Clean batches only)',
        'impact': 'High environmental persistence and microplastic pollution if dumped into open landfills.',
        'compliance': 'Dispose in black general waste bins if non-soiled. If blood-soiled, reroute to Yellow Category.',
        'overview': '3-Ply surgical face mask or N95 respirator. Non-infectious general healthcare waste unless visibly stained.',
        'hazardIndex': 24, 'infectionVector': 'Respiratory droplets and airborne particulates (minimal risk when dry)',
        'carbonFootprintKg': 0.021, 'landfillPersistenceYears': 450,
        'materialComposition': [
            {'material': 'Melt-blown Polypropylene Microfibers', 'percentage': 84, 'color': '#06b6d4'},
            {'material': 'Aluminum / Galvanized Nose Wire', 'percentage': 9, 'color': '#94a3b8'},
            {'material': 'Elastic Spandex / Polyester Ear Loops', 'percentage': 7, 'color': '#cbd5e1'}
        ],
        'whoProtocol': ['Remove using ear loops without touching the front filtration surface.', 'Place into Black Category bin for general hospital waste stream.', 'Perform standard hand sanitization after disposal.'],
        'requiredPPE': ['Standard Clinical Precautions', 'Sanitizer'],
        'audioAlert': 'General healthcare mask detected. Segregate into Black Category general waste.'
    },
    'Gauze': {
        'category': 'Biohazard Waste', 'riskLevel': 'Critical',
        'disposalMethod': 'Autoclaving followed by High-Temperature Incineration', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None (Biohazard Absorbent Material)',
        'impact': 'Extreme biological pathogen reservoir from absorbed blood and wound exudates.',
        'compliance': 'Seal immediately in leak-proof yellow biohazard bags.',
        'overview': 'Sterile cotton woven surgical gauze saturated with biological exudates. High microbial replication potential.',
        'hazardIndex': 88, 'infectionVector': 'High viral and bacterial microbial load from absorbed biological fluids',
        'carbonFootprintKg': 0.052, 'landfillPersistenceYears': 5,
        'materialComposition': [
            {'material': 'Bleached Woven Cotton Cellulose', 'percentage': 58, 'color': '#e2e8f0'},
            {'material': 'Absorbed Blood & Serous Fluids', 'percentage': 36, 'color': '#dc2626'},
            {'material': 'Antimicrobial / Saline Wound Residue', 'percentage': 6, 'color': '#38bdf8'}
        ],
        'whoProtocol': ['Do not compress or squeeze saturated dressings.', 'Place directly into thick Yellow Category biohazard bag.', 'Subject to high-temperature rotary kiln incineration above 1000°C.'],
        'requiredPPE': ['Fluid-Resistant Nitrile Gloves', 'Plastic Sleeve Protectors', 'Surgical Mask'],
        'audioAlert': 'Warning: Biohazard saturated gauze detected. Route directly to Yellow Biohazard bag.'
    },
    'Body Tissue or Organ': {
        'category': 'Biohazard Waste', 'riskLevel': 'Critical',
        'disposalMethod': 'High-Temperature Incineration', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None',
        'impact': 'Severe biological infection hazard, rapid decomposition, and pathogenic outbreak vector.',
        'compliance': 'Double bag in heavy-duty yellow biohazard bags. Incinerate immediately at over 1100°C.',
        'overview': 'Human anatomical tissue, biopsy specimens, or surgical resections. Highly regulated biohazard category.',
        'hazardIndex': 98, 'infectionVector': 'Primary biohazard transmission, systemic pathogens',
        'carbonFootprintKg': 0.220, 'landfillPersistenceYears': 0,
        'materialComposition': [
            {'material': 'Organic Cellular Tissue & Water', 'percentage': 75, 'color': '#dc2626'},
            {'material': 'Biological Blood & Plasma', 'percentage': 20, 'color': '#991b1b'},
            {'material': 'Histological Preservative / Saline', 'percentage': 5, 'color': '#f87171'}
        ],
        'whoProtocol': ['Double-bag in heavy gauge yellow biohazard bags.', 'Store in refrigerated holding under 4°C if not incinerated immediately.', 'Completely incinerate in twin-chamber high-temperature facility.'],
        'requiredPPE': ['Heavy-Duty Nitrile Gloves', 'Fluid-Impervious Apron', 'PAPR / N95 Respirator', 'Safety Goggles'],
        'audioAlert': 'Critical Biohazard: Anatomical tissue detected. Double-bag in Yellow Category immediately.'
    },
    'Glass Equipment': {
        'category': 'Sharps Waste', 'riskLevel': 'High',
        'disposalMethod': 'Secure Containment & Autoclaving', 'colorBin': 'Yellow Category',
        'rec': 'Partial', 'recyclingMethod': 'Decontaminate and send to specialist glass recycler.',
        'impact': 'Severe puncture and laceration risk from broken glass edges.',
        'compliance': 'Place in rigid puncture-resistant containers. Label clearly.',
        'overview': 'Laboratory or clinical glassware (flasks, test tubes, slides). Risk of shattering and lacerations.',
        'hazardIndex': 75, 'infectionVector': 'Laceration cuts and percutaneous chemical/biological exposure',
        'carbonFootprintKg': 0.090, 'landfillPersistenceYears': 1000,
        'materialComposition': [
            {'material': 'Soda-Lime / Borosilicate Glass', 'percentage': 94, 'color': '#0ea5e9'},
            {'material': 'Chemical Reagent / Serum Film', 'percentage': 6, 'color': '#f59e0b'}
        ],
        'whoProtocol': ['Place in puncture-proof cardboard or plastic container.', 'Do not exceed fill level beyond 3/4 capacity.', 'Autoclave and send for controlled glass recycling.'],
        'requiredPPE': ['Cut-Resistant Gloves', 'Safety Glasses'],
        'audioAlert': 'Glass clinical equipment detected. Dispose in puncture-resistant container.'
    },
    'Metal Equipment': {
        'category': 'Sharps Waste', 'riskLevel': 'High',
        'disposalMethod': 'Autoclaving & Secure Containment', 'colorBin': 'Yellow Category',
        'rec': 'Partial', 'recyclingMethod': 'Autoclave sterilization then metal recycling.',
        'impact': 'Lacerations and bloodborne pathogen cross-infection risk.',
        'compliance': 'Place in puncture-proof metal sharps bins. Seal when 75% full.',
        'overview': 'Metallic surgical implements, disposable blades, or stainless steel instruments.',
        'hazardIndex': 80, 'infectionVector': 'Lacerations and bloodborne pathogen transmission',
        'carbonFootprintKg': 0.120, 'landfillPersistenceYears': 100,
        'materialComposition': [
            {'material': 'Martensitic / Austenitic Stainless Steel', 'percentage': 96, 'color': '#64748b'},
            {'material': 'Trace Biological Contaminant', 'percentage': 4, 'color': '#ef4444'}
        ],
        'whoProtocol': ['Deposit in heavy-gauge puncture-resistant sharps box.', 'Steam sterilize at 134°C for 18 minutes.', 'Recover metal for specialized clinical recycling.'],
        'requiredPPE': ['Puncture-Resistant Gloves', 'Face Visor'],
        'audioAlert': 'Surgical metal sharps detected. Deposit in rigid puncture-proof bin.'
    },
    'Organic Waste': {
        'category': 'Biohazard Waste', 'riskLevel': 'High',
        'disposalMethod': 'Incineration', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None',
        'impact': 'Biological decomposition vector. Potential pathogenic contamination.',
        'compliance': 'Bag in yellow biohazard containers. Do not mix with municipal waste.',
        'overview': 'Organic clinical waste material including biological specimens and contaminated swabs.',
        'hazardIndex': 70, 'infectionVector': 'Biological decomposition and cross-contamination',
        'carbonFootprintKg': 0.065, 'landfillPersistenceYears': 1,
        'materialComposition': [
            {'material': 'Organic Biological Material', 'percentage': 85, 'color': '#84cc16'},
            {'material': 'Moisture / Biological Fluids', 'percentage': 15, 'color': '#22d3ee'}
        ],
        'whoProtocol': ['Place in yellow biohazard container.', 'Seal bags with tamper-evident ties.', 'Route to licensed clinical incineration facility.'],
        'requiredPPE': ['Nitrile Examination Gloves', 'Surgical Mask'],
        'audioAlert': 'Organic clinical waste detected. Route to Yellow Category biohazard stream.'
    },
    'Plastic Equipment': {
        'category': 'Recyclable Waste', 'riskLevel': 'Low',
        'disposalMethod': 'Decontaminate then Shredding & Polymer Recycling', 'colorBin': 'Blue Category',
        'rec': 'Yes', 'recyclingMethod': 'Polymer pelletization for non-clinical plastics',
        'impact': 'Reduces carbon footprint. Saves raw material oil extraction.',
        'compliance': 'Ensure not contaminated. Sanitize before placing in blue bin.',
        'overview': 'Clean non-clinical plastic apparatus, packaging, or measuring cups. Prime candidate for sustainable recycling.',
        'hazardIndex': 18, 'infectionVector': 'Non-hazardous surface contaminants (Low Risk)',
        'carbonFootprintKg': 0.032, 'landfillPersistenceYears': 450,
        'materialComposition': [
            {'material': 'High-Density Polyethylene (HDPE)', 'percentage': 60, 'color': '#3b82f6'},
            {'material': 'Polypropylene (PP)', 'percentage': 35, 'color': '#60a5fa'},
            {'material': 'Inert Paper Label / Adhesive', 'percentage': 5, 'color': '#94a3b8'}
        ],
        'whoProtocol': ['Verify absence of blood or chemical contamination.', 'Deposit in Blue Category clean plastic container.', 'Compress and bale for circular polymer recycling.'],
        'requiredPPE': ['General Handling Gloves'],
        'audioAlert': 'Recyclable plastic apparatus detected. Place in Blue Category recycling.'
    },
    'Paper Equipment': {
        'category': 'Biohazard Waste', 'riskLevel': 'Medium',
        'disposalMethod': 'Secure Incineration', 'colorBin': 'Yellow Category',
        'rec': 'No', 'recyclingMethod': 'None',
        'impact': 'Carries absorbed pharmaceutical or biological agents.',
        'compliance': 'Bag in yellow containers. Do not mix with municipal waste.',
        'overview': 'Sterilization wrap paper, under-pads, or pharmaceutical packaging contaminated with body fluids or drugs.',
        'hazardIndex': 45, 'infectionVector': 'Absorbed medication or biological fluid residue',
        'carbonFootprintKg': 0.025, 'landfillPersistenceYears': 2,
        'materialComposition': [
            {'material': 'Bleached Kraft Pulp Cellulose', 'percentage': 82, 'color': '#e2e8f0'},
            {'material': 'Moisture Barrier Polyethylene Coating', 'percentage': 12, 'color': '#38bdf8'},
            {'material': 'Residual Biological Staining', 'percentage': 6, 'color': '#f59e0b'}
        ],
        'whoProtocol': ['Place in Yellow Category clinical waste bag.', 'Do not mix with unsoiled paper recycling.', 'Send to licensed healthcare incineration facility.'],
        'requiredPPE': ['Clinical Gloves'],
        'audioAlert': 'Contaminated paper equipment detected. Segregate into Yellow Category.'
    },
    'Tweezers': {
        'category': 'Sharps Waste', 'riskLevel': 'Medium',
        'disposalMethod': 'Autoclaving & Secure Recycling', 'colorBin': 'Yellow Category',
        'rec': 'Partial', 'recyclingMethod': 'Sterilize then send to certified metal recycler.',
        'impact': 'Scratch and laceration risk. Potential pathogen vector.',
        'compliance': 'Sterilize in autoclave. Dispose in rigid sharps containers.',
        'overview': 'Surgical forceps or dressing tweezers. High-precision metal instrument requiring decontamination.',
        'hazardIndex': 60, 'infectionVector': 'Puncture or scratch injuries with biological inoculation',
        'carbonFootprintKg': 0.050, 'landfillPersistenceYears': 100,
        'materialComposition': [
            {'material': 'Surgical Grade Stainless Steel', 'percentage': 95, 'color': '#64748b'},
            {'material': 'Organic Surface Residue', 'percentage': 5, 'color': '#ef4444'}
        ],
        'whoProtocol': ['Place in rigid sharps container.', 'If reusable, route to Central Sterile Services Department (CSSD).', 'If single-use, autoclave and recycle.'],
        'requiredPPE': ['Heavy Nitrile Gloves', 'Goggles'],
        'audioAlert': 'Medical tweezers detected. Dispose in Yellow sharps bin or route to CSSD.'
    }
}

STREAM_COLORS = {
    'Sharps Waste': '#EAB308',
    'Biohazard Waste': '#F97316',
    'Infectious Waste': '#EF4444',
    'Recyclable Waste': '#3B82F6',
    'General Waste': '#10B981'
}

STREAM_COLORS_BGR = {
    'Sharps Waste': (15, 210, 255),      # Yellow/Amber
    'Biohazard Waste': (25, 125, 255),    # Orange
    'Infectious Waste': (50, 50, 245),    # Red
    'Recyclable Waste': (245, 140, 40),   # Blue
    'General Waste': (80, 210, 80)        # Green
}

def get_metadata(class_name: str) -> dict:
    if class_name in DETAILED_METADATA:
        return DETAILED_METADATA[class_name]
    basic = WASTE_METADATA.get(class_name, {})
    return {
        'category': basic.get('category', 'Biohazard Waste'),
        'riskLevel': basic.get('riskLevel', 'Medium'),
        'disposalMethod': basic.get('disposalMethod', 'Clinical Incineration'),
        'colorBin': basic.get('colorBin', 'Yellow Category'),
        'rec': 'No',
        'recyclingMethod': 'None',
        'impact': 'Clinical waste requiring proper segregation.',
        'compliance': 'Follow standard clinical waste protocol.',
        'overview': f'{class_name} detected. Clinical waste specimen requiring proper segregation.',
        'hazardIndex': basic.get('hazardIndex', 50),
        'infectionVector': 'Standard clinical contact risk',
        'carbonFootprintKg': 0.05,
        'landfillPersistenceYears': 100,
        'materialComposition': [{'material': 'Clinical Material', 'percentage': 100, 'color': '#64748b'}],
        'whoProtocol': ['Follow standard waste segregation protocol.', 'Dispose in appropriate color-coded bin.'],
        'requiredPPE': ['Clinical Gloves', 'Standard Precautions'],
        'audioAlert': f'{class_name} detected. Follow clinical waste protocol.'
    }

def draw_multi_object_annotations(img_bgr, detections):
    """Draw high-resolution bounding boxes, corner reticles, and label badges for all detected items."""
    annotated = img_bgr.copy()
    h, w = annotated.shape[:2]

    # Semi-transparent top HUD status bar
    overlay = annotated.copy()
    bar_height = 42
    cv2.rectangle(overlay, (0, 0), (w, bar_height), (15, 15, 22), -1)
    cv2.addWeighted(overlay, 0.85, annotated, 0.15, 0, annotated)

    hud_text = f"MEDjestic Multi-Object Vision | Traced: {len(detections)} Specimen(s)"
    cv2.putText(annotated, hud_text, (16, 26), cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

    for det in detections:
        x1, y1, x2, y2 = det['box']
        label = det['label']
        conf = det['confidence']
        det_id = det.get('id', 1)
        meta = get_metadata(label)
        category = meta['category']
        color_bgr = STREAM_COLORS_BGR.get(category, (25, 125, 255))

        # 1. Main bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color_bgr, 2)

        # 2. Sleek corner bracket accents
        c_len = max(8, min(24, int(min(x2 - x1, y2 - y1) * 0.2)))
        thick = 3
        # Top-left
        cv2.line(annotated, (x1, y1), (x1 + c_len, y1), color_bgr, thick)
        cv2.line(annotated, (x1, y1), (x1, y1 + c_len), color_bgr, thick)
        # Top-right
        cv2.line(annotated, (x2, y1), (x2 - c_len, y1), color_bgr, thick)
        cv2.line(annotated, (x2, y1), (x2, y1 + c_len), color_bgr, thick)
        # Bottom-left
        cv2.line(annotated, (x1, y2), (x1 + c_len, y2), color_bgr, thick)
        cv2.line(annotated, (x1, y2), (x1, y2 - c_len), color_bgr, thick)
        # Bottom-right
        cv2.line(annotated, (x2, y2), (x2 - c_len, y2), color_bgr, thick)
        cv2.line(annotated, (x2, y2), (x2, y2 - c_len), color_bgr, thick)

        # 3. Label badge
        badge_text = f"#{det_id} {label} {conf*100:.0f}%"
        font = cv2.FONT_HERSHEY_DUPLEX
        font_scale = 0.45
        (tw, th), baseline = cv2.getTextSize(badge_text, font, font_scale, 1)

        badge_y1 = max(bar_height + 2, y1 - th - 8)
        badge_y2 = badge_y1 + th + 8
        badge_x2 = min(w - 2, x1 + tw + 12)

        # Badge background
        cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), color_bgr, -1)
        # Badge text
        cv2.putText(annotated, badge_text, (x1 + 6, badge_y2 - 5), font, font_scale, (15, 15, 20), 1, cv2.LINE_AA)

    # Bottom badge
    badge_bottom = f"Model: {MODEL_FULL_NAME} | Two-Stage Detector + ViT"
    cv2.putText(annotated, badge_bottom, (12, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160, 160, 160), 1, cv2.LINE_AA)

    return annotated

def build_multi_object_response(detections: list, img_bgr, source: str = "image", runtime: str = "cpu", fallback_reason: str = None) -> dict:
    """Build full frontend-compatible response with rich multi-object detections schema."""
    h, w = img_bgr.shape[:2]
    
    if not detections:
        return {
            'detectedType': 'None',
            'category': 'None',
            'confidence': 0.0,
            'runtime': runtime,
            'gpu_fallback_reason': fallback_reason,
            'is_uncertain': True,
            'uncertainty_warning': 'No medical waste detected in image.',
            'riskLevel': 'Low',
            'disposalMethod': 'None',
            'colorBin': 'None',
            'recyclable': 'Unknown',
            'recyclingMethod': 'None',
            'impact': 'No specimen detected.',
            'compliance': 'N/A',
            'overview': 'No medical waste detected in image.',
            'hazardIndex': 0,
            'infectionVector': 'None',
            'carbonFootprintKg': 0.0,
            'landfillPersistenceYears': 0,
            'materialComposition': [],
            'whoProtocol': [],
            'requiredPPE': [],
            'audioAlert': '',
            'boundingBoxes': [],
            'weight': 0.0,
            'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'modelUsed': MODEL_FULL_NAME,
            'detections': [],
            'itemsCount': 0,
            'streamBreakdown': {},
            'imageDimensions': {'width': w, 'height': h},
            'annotatedImage': '',
            'probabilities': []
        }

    # Format detections and bounding boxes
    formatted_detections = []
    bounding_boxes = []
    stream_counts = {}

    for i, d in enumerate(detections):
        det_id = i + 1
        label = d['label']
        conf = d['confidence']
        box = d['box']
        track_id = d.get('track_id', det_id)
        meta = get_metadata(label)
        category = meta['category']
        stream_color = STREAM_COLORS.get(category, '#F97316')
        
        stream_counts[category] = stream_counts.get(category, 0) + 1
        
        # Per-crop probability candidate distribution
        all_p = d.get('all_probabilities', {})
        crop_probs_list = [
            {
                'label': k,
                'confidence': v,
                'percentage': round(v * 100, 1),
                'category': get_metadata(k)['category'],
                'colorBin': get_metadata(k)['colorBin']
            }
            for k, v in sorted(all_p.items(), key=lambda item: item[1], reverse=True)
        ]

        det_dict = {
            'id': det_id,
            'track_id': track_id,
            'label': label,
            'detectedType': label,
            'category': category,
            'confidence': conf,
            'box': box,
            'color': stream_color,
            'colorBin': meta['colorBin'],
            'riskLevel': meta['riskLevel'],
            'disposalMethod': meta['disposalMethod'],
            'recyclable': meta.get('rec', 'No'),
            'recyclingMethod': meta.get('recyclingMethod', 'None'),
            'impact': meta.get('impact', ''),
            'compliance': meta.get('compliance', ''),
            'overview': meta.get('overview', ''),
            'hazardIndex': meta.get('hazardIndex', 50),
            'infectionVector': meta.get('infectionVector', ''),
            'carbonFootprintKg': meta.get('carbonFootprintKg', 0.05),
            'landfillPersistenceYears': meta.get('landfillPersistenceYears', 100),
            'materialComposition': meta.get('materialComposition', []),
            'whoProtocol': meta.get('whoProtocol', []),
            'requiredPPE': meta.get('requiredPPE', []),
            'audioAlert': meta.get('audioAlert', ''),
            'weight': round(0.12, 2),
            'probabilities': crop_probs_list,
            'all_probabilities': all_p
        }
        formatted_detections.append(det_dict)

        bounding_boxes.append({
            'id': det_id,
            'track_id': track_id,
            'label': label,
            'confidence': conf,
            'category': category,
            'color': stream_color,
            'colorBin': meta['colorBin'],
            'box': box
        })

    # Render multi-object annotated image
    annotated_bgr = draw_multi_object_annotations(img_bgr, detections)
    _, buffer = cv2.imencode('.jpg', annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    annotated_b64 = 'data:image/jpeg;base64,' + base64.b64encode(buffer).decode('utf-8')

    # Primary detection (highest confidence)
    primary = formatted_detections[0]

    return {
        'detectedType': primary['label'],
        'category': primary['category'],
        'confidence': primary['confidence'],
        'runtime': runtime,
        'gpu_fallback_reason': fallback_reason,
        'is_uncertain': primary.get('is_uncertain', False),
        'uncertainty_warning': None,
        'riskLevel': primary['riskLevel'],
        'disposalMethod': primary['disposalMethod'],
        'colorBin': primary['colorBin'],
        'recyclable': primary['recyclable'],
        'recyclingMethod': primary['recyclingMethod'],
        'impact': primary['impact'],
        'compliance': primary['compliance'],
        'overview': f"Detected {len(detections)} medical waste item(s). Primary specimen: {primary['label']} ({primary['confidence']*100:.1f}%).",
        'hazardIndex': primary['hazardIndex'],
        'infectionVector': primary['infectionVector'],
        'carbonFootprintKg': round(sum(d['carbonFootprintKg'] for d in formatted_detections), 3),
        'landfillPersistenceYears': max(d['landfillPersistenceYears'] for d in formatted_detections),
        'materialComposition': primary['materialComposition'],
        'whoProtocol': primary['whoProtocol'],
        'requiredPPE': primary['requiredPPE'],
        'audioAlert': primary['audioAlert'],
        'boundingBoxes': bounding_boxes,
        'weight': round(sum(d['weight'] for d in formatted_detections), 2),
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'modelUsed': MODEL_FULL_NAME,
        'detections': formatted_detections,
        'itemsCount': len(formatted_detections),
        'streamBreakdown': stream_counts,
        'imageDimensions': {'width': w, 'height': h},
        'annotatedImage': annotated_b64,
        'all_probabilities': primary['all_probabilities'],
        'probabilities': primary['probabilities']
    }
