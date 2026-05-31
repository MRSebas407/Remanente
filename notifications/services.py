import logging
import re
import time
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PENDING = frozenset({'starting', 'loading', 'initializing', 'browser'})
READY = frozenset({'connected', 'ready'})


class OpenWAService:
    def __init__(self):
        self.base_url = settings.OPENWA_BASE_URL.rstrip('/')
        self.session_name = settings.OPENWA_SESSION_ID
        self.session_id = None
        self._api_key = None
        self.headers = {}
        self._init_headers()

    def _init_headers(self):
        from notifications.openwa_db import get_api_key
        self._api_key = get_api_key() or settings.OPENWA_API_KEY
        self.headers = {
            'X-API-Key': self._api_key,
            'Content-Type': 'application/json',
        }

    def _request(self, method, path, **kwargs):
        url = f'{self.base_url}{path}'
        kwargs.setdefault('headers', self.headers)
        kwargs.setdefault('timeout', 15)
        try:
            return requests.request(method, url, **kwargs)
        except requests.RequestException as e:
            logger.warning('OpenWA request failed %s %s: %s', method, path, e)
            return None

    def _resolve_session(self):
        """Find session UUID by name."""
        if self.session_id:
            return self.session_id
        resp = self._request('GET', '/sessions', timeout=10)
        if not resp or resp.status_code != 200:
            logger.warning('OpenWA list sessions returned %s', getattr(resp, 'status_code', None))
            return None
        for s in resp.json():
            if s.get('name') == self.session_name:
                self.session_id = s['id']
                logger.info('OpenWA session resolved: %s (status=%s)', s['id'], s.get('status'))
                return self.session_id
        logger.warning('OpenWA session "%s" not found among %d sessions', self.session_name, len(resp.json()))
        return None

    def _reset_session(self):
        """Delete stale session and create a fresh one. Returns new session id or None."""
        old_id = self._resolve_session()
        if old_id:
            logger.info('OpenWA deleting stale session %s', old_id)
            self._request('POST', f'/sessions/{old_id}/logout')
            time.sleep(1)
            self._request('DELETE', f'/sessions/{old_id}')
            time.sleep(2)
        self.session_id = None
        for _ in range(3):
            resp = self._request('POST', '/sessions', json={'name': self.session_name})
            if resp and resp.status_code in (200, 201):
                session = resp.json()
                time.sleep(2)
                self._request('POST', f'/sessions/{session["id"]}/start')
                self.session_id = session['id']
                return self.session_id
            time.sleep(3)
        return None

    def session_status(self) -> str | None:
        """Get current session status string (connected/qr_ready/etc)."""
        sid = self._resolve_session()
        if not sid:
            return None
        resp = self._request('GET', f'/sessions/{sid}')
        if resp and resp.status_code == 200:
            return resp.json().get('status')
        logger.warning('OpenWA session status request returned %s', getattr(resp, 'status_code', None))
        return None

    def ensure_ready(self) -> bool:
        """Make sure OpenWA session is ready. Returns True if ready to send."""
        status = self.session_status()
        if status in READY:
            return True
        if status in PENDING:
            logger.info('OpenWA session is "%s", not resetting — try again later', status)
            return False
        if status:
            logger.info('OpenWA session status is "%s", resetting...', status)
        self._reset_session()
        status = self.session_status()
        return status in READY

    def _format_phone(self, phone: str) -> str:
        """Convert local phone to WhatsApp format (e.g. 573209999999@c.us)."""
        if not phone:
            return None
        country_code = getattr(settings, 'OPENWA_COUNTRY_CODE', '57')
        phone = re.sub(r'[^\d]', '', phone.strip())
        if not phone:
            return None
        if phone.startswith('00'):
            phone = phone[2:]
        if phone.startswith('0'):
            phone = phone[1:]
        if not phone.startswith(country_code):
            phone = country_code + phone
        return f'{phone}@c.us'

    def send_text(self, phone: str, message: str) -> dict:
        """Send a text message via OpenWA."""
        status = self.session_status()
        if status in READY:
            pass
        elif status in PENDING:
            return {'success': False, 'error': f'Session {status}, try again later'}
        else:
            if status:
                logger.info('send_text: session status "%s", resetting...', status)
            self._reset_session()
            status = self.session_status()
            if status not in READY:
                return {'success': False, 'error': f'Session not ready (status={status})'}

        chat_id = self._format_phone(phone)
        if not chat_id:
            return {'success': False, 'error': 'Invalid phone number'}

        payload = {'chatId': chat_id, 'text': message}
        resp = self._request('POST',
            f'/sessions/{self.session_id}/messages/send-text',
            json=payload)

        if resp and resp.status_code in (200, 201):
            logger.info('Message sent to %s', chat_id)
            return {'success': True, 'data': resp.json()}

        err = resp.text[:500] if resp else 'No response'
        logger.warning('Send to %s failed (status=%s): %s', chat_id,
                       resp.status_code if resp else 'N/A', err)
        return {'success': False, 'error': err}

    def health_check(self) -> bool:
        """Check if OpenWA API is reachable."""
        resp = self._request('GET', '/health', timeout=(3, 5))
        ok = bool(resp and resp.status_code == 200)
        logger.debug('OpenWA health check: %s', 'ok' if ok else 'fail')
        return ok

    def _format_tiempo(self, delta) -> str:
        horas = delta.total_seconds() / 3600
        if horas >= 24 and horas % 24 == 0:
            dias = int(horas // 24)
            return f'{dias} día' if dias == 1 else f'{dias} días'
        return f'{int(horas)} horas'

    def notify_assignment(self, adviser, person, call_detail=None) -> dict:
        phone = adviser.profile.phone
        if call_detail:
            tiempo = self._format_tiempo(call_detail.scheduled_date - call_detail.call.created_in)
            message = (
                f'Hola {adviser.profile.names} {adviser.profile.last_name}, '
                f'te informamos que se te ha asignado a {person.names} {person.lastname}. '
                f'Tienes un tiempo de {tiempo} para hacer la primera llamada. '
                f'Lo puedes hacer al siguiente número: {person.phone}'
            )
        else:
            message = (
                f'Hola {adviser.profile.names} {adviser.profile.last_name}, '
                f'te informamos que se te ha asignado a {person.names} {person.lastname} '
                f'para el proceso de fundamentos. Puedes ver los detalles en el panel de la aplicación. '
                f'Muchas gracias.'
            )
        return self.send_text(phone, message)

    def notify_call_recorded(self, adviser, person, call_number) -> dict:
        phone = adviser.profile.phone
        message = (
            f'Gracias por comunicarte con {person.names} {person.lastname}. '
            f'Recuerda que también puedes ver el estado de las personas que se te asignaron '
            f'en el panel de la aplicación. '
            f'Te recuerdo que la siguiente llamada será dentro de 8 días, '
            f'atento(a) a las notificaciones o al panel de la aplicación. '
            f'Muchas gracias.'
        )
        return self.send_text(phone, message)

    def notify_third_call_completed(self, adviser, person) -> dict:
        phone = adviser.profile.phone
        message = (
            f'Felicidades {adviser.profile.names} {adviser.profile.last_name}, '
            f'has completado las 3 llamadas con {person.names} {person.lastname} '
            f'de manera exitosa. '
            f'Agradecemos tu esfuerzo y tiempo dedicado. '
        )
        return self.send_text(phone, message)
