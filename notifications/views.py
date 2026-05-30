import json
import logging
import time
import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from notifications.openwa_db import get_api_key

logger = logging.getLogger(__name__)

BASE_URL = settings.OPENWA_BASE_URL.rstrip('/')
SESSION_NAME = settings.OPENWA_SESSION_ID


def _get_headers():
    key = get_api_key() or settings.OPENWA_API_KEY
    return {'Content-Type': 'application/json', 'X-API-Key': key}


@csrf_exempt
@require_POST
def openwa_webhook(request):
    payload = json.loads(request.body)
    event = payload.get('event')
    data = payload.get('data', {})

    logger.info(f'OpenWA webhook event: {event} - {data}')

    return JsonResponse({'status': 'ok'})

HTML = '''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>OpenWA QR</title>
<style>
  body {{ font-family: sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }}
  .card {{ background: white; border-radius: 12px; padding: 40px; display: inline-block; box-shadow: 0 2px 12px rgba(0,0,0,0.1); max-width: 400px; }}
  img {{ width: 276px; height: 276px; }}
  .status {{ margin-top: 20px; color: #666; }}
  .msg {{ font-size: 18px; margin: 20px 0; }}
</style>
<meta http-equiv="refresh" content="{refresh}">
</head>
<body>
  <div class="card">
    {content}
  </div>
</body>
</html>'''


def _openwa(method, path, **kwargs):
    url = f'{BASE_URL}{path}'
    headers = _get_headers()
    kwargs.setdefault('headers', headers)
    kwargs.setdefault('timeout', 15)
    return requests.request(method, url, **kwargs)


def qr_view(request):
    resp = _openwa('GET', '/sessions', timeout=10)
    if resp.status_code != 200:
        return _html('Error conectando con OpenWA', 'openwa_error', 5)

    sessions = resp.json()
    session = next((s for s in sessions if s.get('name') == SESSION_NAME), None)

    if not session:
        resp = _openwa('POST', '/sessions', json={'name': SESSION_NAME})
        if resp.status_code not in (200, 201):
            return _html(f'Error creando sesión: {resp.text}', 'openwa_error', 5)
        session = resp.json()
        time.sleep(2)
        start_resp = _openwa('POST', f'/sessions/{session["id"]}/start')
        if start_resp.status_code not in (200, 201):
            logger.warning(f'Session created but start returned {start_resp.status_code}: {start_resp.text}')
            # Clean up failed session and try once more
            _openwa('DELETE', f'/sessions/{session["id"]}')
            resp = _openwa('POST', '/sessions', json={'name': SESSION_NAME})
            if resp.status_code in (200, 201):
                session2 = resp.json()
                time.sleep(2)
                _openwa('POST', f'/sessions/{session2["id"]}/start')
        return _html('Sesión creada. Iniciando...', 'starting', 5)

    sid = session['id']
    status = session.get('status', '')

    STALLED = ('created', 'stopped', 'failed', 'error', 'disconnected')
    PENDING = ('starting', 'loading', 'initializing', 'browser')

    if status in STALLED:
        resp = _openwa('POST', f'/sessions/{sid}/start')
        if resp.status_code not in (200, 201):
            logger.warning(f'Session {sid} start failed (status={status}): {resp.status_code}')
            _openwa('DELETE', f'/sessions/{sid}')
            resp = _openwa('POST', '/sessions', json={'name': SESSION_NAME})
            if resp.status_code in (200, 201):
                session = resp.json()
                time.sleep(2)
                _openwa('POST', f'/sessions/{session["id"]}/start')
                return _html('Sesión corrupta. Recreando...', 'starting', 5)
            return _html(f'Error creando nueva sesión: {resp.text}', 'openwa_error', 5)
        return _html('Iniciando sesión...', 'starting', 5)

    if status in PENDING:
        return _html(f'Iniciando... ({status})', 'starting', 5)

    if status == 'qr_ready':
        resp = _openwa('GET', f'/sessions/{sid}/qr', timeout=30)
        if resp.status_code != 200:
            logger.warning(f'QR endpoint returned {resp.status_code}: {resp.text[:200]}')
            return _html(f'QR no disponible', 'waiting', 5)
        data = resp.json()
        img_b64 = data.get('qrCode', '') or data.get('qr', '') or data.get('code', '') or ''
        state = data.get('status', '') or data.get('state', '')
        if not img_b64:
            logger.info(f'QR data keys: {list(data.keys())}, status={status}')
            return _html(f'Esperando QR... ({state})', 'waiting', 5)
        if not img_b64.startswith('data:'):
            img_b64 = f'data:image/png;base64,{img_b64}'
        return _html(f'''
            <h2>Escanéa con WhatsApp</h2>
            <p>Abre WhatsApp > Vincular dispositivo</p>
            <img src="{img_b64}" alt="QR Code"/>
            <p class="status">Estado: {state}</p>
        ''', 'connected', 0)

    if status == 'connected':
        return _html('WhatsApp ya está conectado.', 'connected', 10)

    return _html(f'Estado desconocido: {status}', 'waiting', 5)


def _html(msg, state, refresh):
    content = ''
    if state == 'starting':
        content = f'<div class="msg">⏳ {msg}</div><p>La primera vez puede tardar hasta 30 segundos (Puppeteer/Chromium iniciando).</p>'
    elif state == 'waiting':
        content = f'<div class="msg">⏳ {msg}</div><p>Refrescando automáticamente...</p>'
    elif state == 'connected':
        content = msg
    else:
        content = f'<div class="msg">❌ {msg}</div>'
    return HttpResponse(HTML.format(content=content, refresh=refresh))

