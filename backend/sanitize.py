"""
Input Sanitization Utilities for BookSwap Hub
Strips HTML tags and dangerous characters from user-supplied strings.
Use these helpers on all text fields before saving to the database.
"""
import re


# Regex to strip HTML/script tags
_TAG_RE = re.compile(r'<[^>]+>')
# Regex to strip null bytes
_NULL_RE = re.compile(r'\x00')


def clean(value, max_length=None):
    """
    Strip HTML tags, null bytes, and leading/trailing whitespace from a string.
    Optionally truncate to max_length characters.

    Returns None if value is None or empty after cleaning.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        value = str(value)
    value = _NULL_RE.sub('', value)       # remove null bytes
    value = _TAG_RE.sub('', value)        # strip HTML tags
    value = value.strip()
    if max_length:
        value = value[:max_length]
    return value or None


def clean_email(value):
    """Lowercase, strip, and basic-validate an email string."""
    val = clean(value, max_length=255)
    if val and '@' in val:
        return val.lower()
    return val


def clean_int(value, default=1, min_val=1, max_val=9999):
    """Safely parse an integer within an allowed range."""
    try:
        result = int(value)
        return max(min_val, min(max_val, result))
    except (TypeError, ValueError):
        return default


def clean_float(value):
    """Safely parse a float, returns None on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
