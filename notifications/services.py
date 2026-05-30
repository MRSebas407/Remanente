import requests
from django.conf import settings


class OpenWAService:
    def __init__(self):
        self.base_url = settings.OPENWA_BASE_URL.rstrip('/')
        self.session_name = settings.OPENWA_SESSION_ID
        self.session_id = None
        self._api_key = None
        self.headers = {}

    @property
    def api_key(self):
        if self._api_key is None:
            from notifications.openwa_db import get_api_key
            self._api_key = get_api_key() or settings.OPENWA_API_KEY
            self.headers = {
                'X-API-Key': self._api_key,
                'Content-Type': 'application/json',
            }
        return self._api_key

    def _resolve_session(self):
        """Find session UUID by name."""
        if self.session_id:
            return self.session_id
        try:
            resp = requests.get(
                f'{self.base_url}/sessions',
                headers={'X-API-Key': self.api_key},
                timeout=10,
            )
            if resp.status_code != 200:
                return None
            for s in resp.json():
                if s.get('name') == self.session_name:
                    self.session_id = s['id']
                    return self.session_id
        except requests.RequestException:
            pass
        return None

    def _format_phone(self, phone: str) -> str:
        """Convert local phone to WhatsApp format (e.g. 573209999999@c.us)."""
        if not phone:
            return None
        country_code = getattr(settings, 'OPENWA_COUNTRY_CODE', '57')
        phone = phone.strip()
        if phone.startswith('0'):
            phone = country_code + phone[1:]
        elif not phone.startswith(country_code):
            phone = country_code + phone
        return f'{phone}@c.us'

    def send_text(self, phone: str, message: str) -> dict:
        """Send a text message via OpenWA."""
        session_id = self._resolve_session()
        if not session_id:
            return {'success': False, 'error': 'No active session found'}

        chat_id = self._format_phone(phone)
        if not chat_id:
            return {'success': False, 'error': 'Invalid phone number'}

        url = f'{self.base_url}/sessions/{session_id}/messages/send-text'
        payload = {'chatId': chat_id, 'text': message}

        try:
            resp = requests.post(url, json=payload, headers=self.headers, timeout=15)
            resp.raise_for_status()
            return {'success': True, 'data': resp.json()}
        except requests.RequestException as e:
            return {'success': False, 'error': str(e)}

    def health_check(self) -> bool:
        """Check if OpenWA API is reachable."""
        try:
            resp = requests.get(f'{self.base_url}/health', timeout=(3, 5))
            return resp.status_code == 200
        except requests.RequestException:
            return False

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
