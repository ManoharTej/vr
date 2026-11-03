"""
services/recommender.py — Rule-based outfit recommendation engine.

No LLM or external ML library is required. Recommendations are driven by a
lookup table keyed on occasion, then optionally modified by style_preference
and weather context.
"""
from __future__ import annotations

import copy

# ---------------------------------------------------------------------------
# Base recommendation rules
# ---------------------------------------------------------------------------

OCCASION_RULES: dict[str, dict] = {
    "college": {
        "title": "Relaxed campus essential",
        "description": (
            "Keep it effortless with a comfortable top or tee paired with "
            "your favourite denim. Opt for a pop of colour to stand out."
        ),
        "garment_type": "top",
        "color": "#8270d8",
        "items": [
            "Relaxed-fit top or oversized tee",
            "Straight-leg or wide-leg denim",
            "Clean white sneakers",
            "Casual canvas tote",
        ],
        "accessories": ["Stud earrings", "Minimal watch", "Lightweight backpack"],
    },
    "interview": {
        "title": "Confident interview look",
        "description": (
            "Project professionalism with a well-fitted formal shirt or "
            "structured blazer. Stick to neutral or cool tones."
        ),
        "garment_type": "top",
        "color": "#263650",
        "items": [
            "Crisp formal shirt or structured blouse",
            "Tailored trousers or pencil skirt",
            "Closed-toe flats or low heels",
            "Structured handbag",
        ],
        "accessories": ["Small hoop or stud earrings", "Minimal watch", "Belt"],
    },
    "office": {
        "title": "Polished work-day outfit",
        "description": (
            "Smart-casual dressing that transitions from desk to meetings. "
            "Invest in clean silhouettes and quality fabrics."
        ),
        "garment_type": "jacket",
        "color": "#263650",
        "items": [
            "Smart blazer or structured jacket",
            "Fitted top or blouse underneath",
            "Tailored trousers or midi skirt",
            "Block-heel or loafer shoes",
        ],
        "accessories": ["Delicate necklace", "Watch", "Leather tote"],
    },
    "party": {
        "title": "Stand-out party look",
        "description": (
            "Go bold with a statement dress or vibrant top. Let your outfit "
            "do the talking and keep accessories fun."
        ),
        "garment_type": "dress",
        "color": "#d85c79",
        "items": [
            "Statement midi or mini dress",
            "Strappy heels or block sandals",
            "Evening clutch",
        ],
        "accessories": ["Statement earrings", "Layered necklace", "Clutch bag"],
    },
    "wedding": {
        "title": "Elegant wedding guest outfit",
        "description": (
            "Balance elegance with comfort. A saree-inspired palette or "
            "a flowy maxi dress always works for wedding celebrations."
        ),
        "garment_type": "dress",
        "color": "#d85c79",
        "items": [
            "Flowy maxi dress or festive kurta",
            "Embellished flats or heeled sandals",
            "Ethnic or semi-formal clutch",
        ],
        "accessories": ["Jhumka or chandelier earrings", "Bangles or cuff", "Bindi (optional)"],
    },
    "date": {
        "title": "Charming date-night look",
        "description": (
            "Strike the right balance between dressed-up and effortless. "
            "A wrap dress or elevated top with jeans always works."
        ),
        "garment_type": "dress",
        "color": "#d85c79",
        "items": [
            "Wrap dress or elevated midi",
            "Strappy sandals or kitten heels",
            "Small crossbody bag",
        ],
        "accessories": ["Dainty necklace", "Stud or small hoop earrings", "Light perfume"],
    },
    "festival": {
        "title": "Vibrant festival ensemble",
        "description": (
            "Embrace colour and embroidery. A festive kurta or bright ethnic "
            "outfit is perfect for cultural celebrations."
        ),
        "garment_type": "kurta",
        "color": "#d69a43",
        "items": [
            "Embroidered or printed kurta",
            "Churidar or palazzo trousers",
            "Kolhapuri sandals or juttis",
        ],
        "accessories": ["Oxidised earrings", "Stackable bangles", "Potli bag"],
    },
    "birthday": {
        "title": "Birthday celebration look",
        "description": (
            "Pick something festive and fun — you're the star today. Bold "
            "colour, statement accessories, and comfortable footwear are key."
        ),
        "garment_type": "dress",
        "color": "#d85c79",
        "items": [
            "Bold dress or kurta",
            "Statement colour",
            "Fun accessories",
            "Comfortable footwear",
        ],
        "accessories": ["Statement earrings", "Clutch bag", "Heels or block shoes"],
    },
    "casual": {
        "title": "Effortless casual-party style",
        "description": (
            "Keep it laid-back but put-together. A relaxed top with "
            "well-fitted trousers hits the sweet spot."
        ),
        "garment_type": "top",
        "color": "#8270d8",
        "items": [
            "Casual top or oversized shirt",
            "Relaxed-fit trousers or jeans",
            "Sneakers or loafers",
        ],
        "accessories": ["Simple chain necklace", "Casual watch", "Canvas tote"],
    },
    "traditional": {
        "title": "Traditional celebration outfit",
        "description": (
            "Honour the occasion with traditional silhouettes and rich "
            "fabrics. A well-chosen kurta set or ethnic ensemble is timeless."
        ),
        "garment_type": "kurta",
        "color": "#2c897c",
        "items": [
            "Silk or cotton kurta with embroidery",
            "Churidar or straight-fit trousers",
            "Traditional footwear (juttis or mojaris)",
            "Dupatta in contrast colour",
        ],
        "accessories": ["Kundan or temple jewellery earrings", "Bangles", "Potli bag"],
    },
}

# ---------------------------------------------------------------------------
# Style preference colour overrides
# ---------------------------------------------------------------------------

STYLE_COLOR_MAP: dict[str, str] = {
    "minimal": "#e9dfd0",   # soft cream/ivory
    "bold": "#d85c79",      # vivid rose
    "classic": "#263650",   # deep navy
    "traditional": "#2c897c",  # teal/green
}

# ---------------------------------------------------------------------------
# Weather modifier copy-text appended to description
# ---------------------------------------------------------------------------

WEATHER_NOTES: dict[str, str] = {
    "warm": " Choose breathable fabrics like cotton or linen to stay cool.",
    "cool": " Layer up with a light jacket or cardigan to stay comfortable.",
    "rainy": " Opt for quick-dry fabrics and keep footwear practical.",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_recommendation(
    occasion: str,
    style_preference: str | None = None,
    weather: str | None = None,
) -> dict:
    """
    Build an outfit recommendation for the given occasion and optional context.

    Parameters
    ----------
    occasion:          Target occasion string (matched case-insensitively).
    style_preference:  Optional modifier: minimal | bold | classic | traditional.
    weather:           Optional climate hint: warm | cool | rainy.

    Returns
    -------
    dict matching the RecommendationResponse schema, including an `occasion` key.
    """
    # Normalise occasion to lowercase; fall back to 'casual' if not found
    key = occasion.lower().strip()
    base = OCCASION_RULES.get(key, OCCASION_RULES["casual"])

    # Deep copy so we never mutate the original rule table
    rec = copy.deepcopy(base)

    # --- Apply style_preference modifier ---------------------------------
    if style_preference:
        pref_key = style_preference.lower().strip()
        if pref_key in STYLE_COLOR_MAP:
            rec["color"] = STYLE_COLOR_MAP[pref_key]
        if pref_key == "minimal":
            # Trim accessories list for a cleaner look
            rec["accessories"] = rec["accessories"][:1] if rec["accessories"] else []
            rec["description"] = (
                "Keep it understated with clean lines and a neutral palette. "
                + rec["description"]
            )
        elif pref_key == "bold":
            rec["description"] = (
                "Go all-in on colour and statement pieces. " + rec["description"]
            )
        elif pref_key == "traditional":
            # Nudge towards ethnic garment if not already
            if rec["garment_type"] not in ("kurta",):
                rec["garment_type"] = "kurta"
                rec["color"] = "#2c897c"

    # --- Apply weather modifier ------------------------------------------
    if weather:
        note = WEATHER_NOTES.get(weather.lower().strip(), "")
        rec["description"] += note

        if weather.lower() == "warm":
            # Suggest breathable layer options
            if "Light cotton jacket or blazer" not in rec["items"]:
                rec["items"].append("Breathable cotton or linen fabric preferred")
        elif weather.lower() == "cool":
            if "Light jacket or cardigan" not in rec["items"]:
                rec["items"].append("Light jacket or cardigan as a layer")

    # Add the resolved occasion key into the response
    rec["occasion"] = key

    return rec
