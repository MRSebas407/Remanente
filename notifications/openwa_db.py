from pathlib import Path

API_KEY_FILE = Path('/openwa_data/.api-key')


def get_api_key():
    if API_KEY_FILE.exists():
        try:
            return API_KEY_FILE.read_text().strip()
        except Exception:
            pass
    return None



def get_all_api_keys():
    key = get_api_key()
    return [key] if key else []
