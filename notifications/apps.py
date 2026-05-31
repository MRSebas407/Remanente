import threading
import time
from django.apps import AppConfig
from django.conf import settings


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notificaciones'

    def ready(self):
        import sys
        is_server = 'runserver' in sys.argv or 'gunicorn' in sys.argv
        if not is_server:
            return
        thread = threading.Thread(target=self._reminder_loop, daemon=True)
        thread.start()
        thread2 = threading.Thread(target=self._ensure_openwa_session, daemon=True)
        thread2.start()

    def _ensure_openwa_session(self):
        import requests
        from django.conf import settings
        from notifications.openwa_db import get_api_key
        from time import sleep

        PENDING = frozenset({'starting', 'loading', 'initializing', 'browser'})
        READY = frozenset({'connected', 'ready'})

        sleep(15)
        BASE = settings.OPENWA_BASE_URL.rstrip('/')
        name = settings.OPENWA_SESSION_ID
        key = get_api_key() or settings.OPENWA_API_KEY

        for attempt in range(3):
            try:
                resp = requests.get(f'{BASE}/sessions', headers={'X-API-Key': key}, timeout=10)
                if resp.status_code != 200:
                    sleep(10)
                    continue
                for s in resp.json():
                    if s.get('name') == name and s.get('status') not in READY and s.get('status') not in PENDING:
                        requests.post(f'{BASE}/sessions/{s["id"]}/start',
                                       headers={'X-API-Key': key}, timeout=15)
                break
            except Exception:
                sleep(10)

    def _reminder_loop(self):
        import io
        from django.core.management import call_command
        from django.db import OperationalError

        interval = getattr(settings, 'REMINDER_INTERVAL', 30)

        while True:
            try:
                call_command('send_call_reminders', stdout=io.StringIO())
            except OperationalError:
                pass
            except Exception:
                pass
            time.sleep(interval)
