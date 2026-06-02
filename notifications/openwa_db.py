from pathlib import Path
from django.conf import settings

API_KEY_FILE = Path('/openwa_data/.api-key')


def get_api_key():
    """Get OpenWA API key from file mounted volume or env var."""
    if API_KEY_FILE.exists():
        try:
            return API_KEY_FILE.read_text().strip()
        except Exception:
            pass
    # Fallback to env var (production uses this directly)
    return getattr(settings, 'OPENWA_API_KEY', None) or None


def get_all_api_keys():
    key = get_api_key()
    return [key] if key else []
