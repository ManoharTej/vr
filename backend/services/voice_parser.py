"""
services/voice_parser.py — Pure-Python NLP intent parser for voice commands.

No external ML library is required. The parser uses ordered keyword scanning
to identify colours, garment types, and user intent from a raw transcript.
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Vocabulary tables
# ---------------------------------------------------------------------------

# Maps spoken colour words to their closest hex palette value
COLORS: dict[str, str] = {
    "red": "#d85c79",
    "rose": "#d85c79",
    "pink": "#d85c79",
    "purple": "#8270d8",
    "lavender": "#8270d8",
    "violet": "#8270d8",
    "blue": "#263f80",
    "navy": "#263650",
    "cobalt": "#263f80",
    "green": "#2c897c",
    "teal": "#2c897c",
    "sage": "#2c897c",
    "yellow": "#d69a43",
    "amber": "#d69a43",
    "mustard": "#d69a43",
    "cream": "#e9dfd0",
    "white": "#e9dfd0",
    "ivory": "#e9dfd0",
    "black": "#262626",
    "charcoal": "#262626",
}

# Maps spoken garment words to canonical garment type identifiers
GARMENT_TYPES: dict[str, str] = {
    "dress": "dress",
    "gown": "dress",
    "frock": "dress",
    "jacket": "jacket",
    "blazer": "jacket",
    "coat": "jacket",
    "kurta": "kurta",
    "kurti": "kurta",
    "salwar": "kurta",
    "ethnic": "kurta",
    "tee": "tee",
    "t-shirt": "tee",
    "tshirt": "tee",
    "tee-shirt": "tee",
    "top": "top",
    "shirt": "top",
    "blouse": "top",
    "tunic": "top",
}

# Maps intent labels to trigger phrases (checked as substring matches)
INTENTS: dict[str, list[str]] = {
    "CHANGE_COLOR": [
        "change to",
        "make it",
        "switch to colour",
        "colour to",
        "change colour",
        "color to",
        "change color",
    ],
    "CHANGE_GARMENT": [
        "show me",
        "try",
        "wear",
        "put on",
        "switch to",
        "i want",
        "give me",
    ],
    "NAVIGATE": [
        "go to",
        "open",
        "navigate to",
        "take me to",
    ],
    "RESET": [
        "reset",
        "remove",
        "clear",
        "start over",
    ],
}

# Human-readable descriptions keyed to each intent label
INTENT_ACTIONS: dict[str, str] = {
    "CHANGE_COLOR": "Change the colour of the current garment",
    "CHANGE_GARMENT": "Switch to a different garment type",
    "NAVIGATE": "Navigate to a different section of the app",
    "RESET": "Reset the current selection",
    "UNKNOWN": "Command not recognised — no action taken",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_voice_command(
    transcript: str,
    current_garment: str | None = None,
    current_color: str | None = None,
) -> dict:
    """
    Parse a raw voice transcript into a structured intent dict.

    Strategy
    --------
    1. Normalise the transcript to lowercase.
    2. Scan for known colour keywords; capture the first match.
    3. Scan for known garment keywords; capture the first match.
    4. Determine primary intent by checking intent trigger phrases in
       priority order: RESET → CHANGE_COLOR → CHANGE_GARMENT → NAVIGATE.
       Fall back to heuristics when no trigger matches (e.g. bare colour
       mention → CHANGE_COLOR; bare garment mention → CHANGE_GARMENT).
    5. Build and return the response dict.

    Parameters
    ----------
    transcript:       Raw string from the speech-to-text engine.
    current_garment:  Optional context — garment type currently displayed.
    current_color:    Optional context — hex colour currently displayed.

    Returns
    -------
    dict with keys: intent, action, garment_type, color, message
    """
    text = transcript.lower().strip()

    # --- Step 1: extract colour -------------------------------------------
    detected_color: str | None = None
    detected_color_name: str | None = None
    for word, hex_val in COLORS.items():
        # Use word-boundary style check: look for the keyword as a whole token
        if _word_in_text(word, text):
            detected_color = hex_val
            detected_color_name = word
            break  # first match wins

    # --- Step 2: extract garment type ------------------------------------
    detected_garment: str | None = None
    detected_garment_word: str | None = None
    # Longer phrases first to avoid "shirt" matching before "t-shirt"
    for keyword in sorted(GARMENT_TYPES.keys(), key=len, reverse=True):
        if keyword in text:
            detected_garment = GARMENT_TYPES[keyword]
            detected_garment_word = keyword
            break

    # --- Step 3: determine intent ----------------------------------------
    intent = _detect_intent(text)

    # Heuristic fallbacks when no explicit trigger phrase was found
    if intent == "UNKNOWN":
        if detected_color and not detected_garment:
            intent = "CHANGE_COLOR"
        elif detected_garment and not detected_color:
            intent = "CHANGE_GARMENT"
        elif detected_garment and detected_color:
            # Both present — default to garment change (colour is modifier)
            intent = "CHANGE_GARMENT"

    # --- Step 4: build human-readable message ----------------------------
    message = _build_message(
        intent,
        detected_garment_word,
        detected_color_name,
        current_garment,
    )

    return {
        "intent": intent,
        "action": INTENT_ACTIONS[intent],
        "garment_type": detected_garment,
        "color": detected_color,
        "message": message,
    }


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _word_in_text(word: str, text: str) -> bool:
    """
    Return True if `word` appears in `text` as a whole-word or phrase match.
    Handles multi-word phrases (e.g. "t-shirt") and single keywords.
    """
    # For hyphenated / multi-word keywords just do substring matching
    if "-" in word or " " in word:
        return word in text
    # For single words, look for the word surrounded by non-alpha chars or edges
    import re
    pattern = rf"(?<![a-z]){re.escape(word)}(?![a-z])"
    return bool(re.search(pattern, text))


def _detect_intent(text: str) -> str:
    """
    Scan trigger phrases in priority order and return the matched intent label.
    RESET is checked first so "reset to green" doesn't become CHANGE_COLOR.
    """
    priority_order = ["RESET", "CHANGE_COLOR", "CHANGE_GARMENT", "NAVIGATE"]
    for intent_label in priority_order:
        for phrase in INTENTS[intent_label]:
            if phrase in text:
                return intent_label
    return "UNKNOWN"


def _build_message(
    intent: str,
    garment_word: str | None,
    color_name: str | None,
    current_garment: str | None,
) -> str:
    """Compose a friendly one-line message for display in the app UI."""
    if intent == "CHANGE_COLOR" and color_name:
        target = current_garment or "garment"
        return f"Changing the {target} colour to {color_name}."
    if intent == "CHANGE_GARMENT" and garment_word:
        suffix = f" in {color_name}" if color_name else ""
        return f"Switching to a {garment_word}{suffix}."
    if intent == "NAVIGATE":
        return "Navigating to the requested section."
    if intent == "RESET":
        return "Resetting the current selection."
    return "Sorry, I didn't understand that command — please try again."
