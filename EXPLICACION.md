# App Iglesia — Explicación del Backend

## ¿Qué es esto?

Es un sistema web para gestionar el proceso de **nuevos miembros** en una iglesia:
- Registrar personas que visitan la iglesia
- Asignarles un **padre espiritual** que los llame
- Hacer hasta 3 llamadas de seguimiento
- Llevarlos a **bautizo** si deciden quedarse
- Reportes para el administrador

Todo funciona con **4 contenedores Docker** en tu PC/servidor:
1. **PostgreSQL** — Base de datos
2. **OpenWA API** — Servicio de WhatsApp
3. **OpenWA Dashboard** — Interfaz web para gestionar OpenWA
4. **Backend Django** — La lógica del sistema

---

## Arquitectura (vista simple)

```
Usuario (celular/computador)
       │
       ▼
  ┌──────────┐      ┌────────────┐
  │  Django   │─────▶│ PostgreSQL │
  │  Backend  │      │ (datos)    │
  └────┬─────┘      └────────────┘
       │
  ┌────▼─────┐
  │  OpenWA  │───▶ WhatsApp
  │ (envía   │
  │  msjs)   │
  └──────────┘
```

- **Django** corre en `http://localhost:8000`
- **OpenWA API** corre en `http://localhost:2785`
- **OpenWA Dashboard** corre en `http://localhost:2886`

---

## Cómo iniciar todo

```bash
cd /ruta/del/proyecto
cp .env.example .env       # solo la primera vez
docker compose up          # o docker compose up --build
```

Al iniciar, el backend automáticamente:
1. Recolecta archivos estáticos
2. Corre migraciones de base de datos
3. Inserta datos de prueba (admin, padre1, padre2, maestro1)
4. Inicia Gunicorn (servidor web)

---

## docker-compose.yml

El archivo `docker-compose.yml` define 4 servicios y usa las variables del `.env` con sintaxis `${VAR}`:

```yaml
services:
  db:                       # PostgreSQL
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  openwa:                   # WhatsApp API (imagen oficial)
    image: ghcr.io/rmyndharis/openwa:latest
    environment:
      NODE_ENV: development
      DATABASE_SYNCHRONIZE: true    # auto-crea tablas
    ports:
      - "2785:2785"
    volumes:
      - openwa_data:/app/data      # persistencia de datos + API key
    healthcheck: ...

  dashboard:                # Dashboard web OpenWA (React + nginx)
    build:
      context: .
      dockerfile: Dockerfile.dashboard
    ports:
      - "2886:80"
    depends_on:
      openwa:
        condition: service_healthy

  backend:                  # Django + DRF
    environment:            # todas las vars del .env
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      SECRET_KEY: ${SECRET_KEY}
      DEBUG: ${DEBUG}
      DJANGO_ALLOWED_HOSTS: ${DJANGO_ALLOWED_HOSTS}
      OPENWA_BASE_URL: ${OPENWA_BASE_URL}
      OPENWA_API_KEY: ${OPENWA_API_KEY}
      OPENWA_SESSION_ID: ${OPENWA_SESSION_ID}
    volumes:
      - .:/app
      - openwa_data:/openwa_data:ro   # lee API key de OpenWA
```

Docker Compose lee automáticamente el archivo `.env` del directorio actual y resuelve los `${VAR}`.

---

## Usuarios de prueba

| Usuario   | Contraseña | Rol                |
|-----------|-----------|--------------------|
| admin     | admin123  | Administrador      |
| padre1    | 123456    | Padre Espiritual   |
| padre2    | 123456    | Padre Espiritual   |
| maestro1  | 123456    | Maestro            |

---

## API — Rutas principales

Todas las rutas en `http://localhost:8000/api/`

### Autenticación
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/auth/login/` | POST | Iniciar sesión |
| `/api/auth/refresh/` | POST | Refrescar token |
| `/api/auth/register/` | POST | Crear asesor (admin) |
| `/api/users/me/` | GET | Tu perfil |

### Catálogos
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/countries/` | GET/POST | Listar o crear país |
| `/api/cities/?country=1` | GET | Ciudades de ese país |
| `/api/neighborhoods/?city=1` | GET | Barrios de esa ciudad |
| `/api/services/` | GET/POST | Servicios de la iglesia |
| `/api/specialisms/` | GET/POST | Especialidades |
| `/api/roles/` | GET | Roles |

### Personas
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/persons/` | GET | Listar personas (filtradas por rol) |
| `/api/persons/` | POST | Registrar nueva persona |
| `/api/persons/{id}/assign_spiritual_father/` | POST | Asignar padre espiritual |

### Llamadas
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/calls/` | GET/POST | Listar o crear llamada |
| `/api/calls/pending_calls/` | GET | Llamadas pendientes con semáforo |
| `/api/calls/{id}/record_call/` | POST | Registrar llamada realizada |

### Bautizos
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/baptisms/` | GET/POST | Registros bautismales |
| `/api/baptisms/pending_baptisms/` | GET | Pendientes de bautizar |

### Dashboard
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/dashboard/?period=monthly` | GET | Reportes |

### Admin de Django
| Ruta | Qué hace |
|---|---|
| `http://localhost:8000/admin/` | Panel admin |

---

## Reglas importantes

### Asignación de padre espiritual
Cuando se crea una persona, automáticamente:
1. Según su especialidad (Joven, Normal, Otra iglesia, Distancia)
2. Busca un padre espiritual del mismo género
3. Que tenga menos de 3 personas asignadas
4. Si encuentra → asigna. Si no → queda como "sin asignar"

### Tiempos de llamada
- **Llamada 1:** 48 horas desde el registro
- **Llamada 2:** 8 días después de registrar la llamada 1
- **Llamada 3:** 8 días después de registrar la llamada 2

### Avisos por WhatsApp
- **Aviso 1:** Cuando falte el 50% del tiempo
- **Aviso 2:** Cuando falte el 25%
- **Aviso 3:** Cuando falte el 12.5%
- El mensaje llega al **padre espiritual**, no a la persona

### Semáforo de colores
- 🟢 **Verde:** más de la mitad del tiempo
- 🟡 **Amarillo:** 25% – 50%
- 🟠 **Naranja:** 0% – 25%
- 🔴 **Rojo:** tiempo cumplido

---

## Cómo configurar WhatsApp (OpenWA)

### ¿Qué es OpenWA?

OpenWA es un proyecto con 2 componentes:
- **API** (NestJS + Node.js, puerto 2785) — motor que se conecta a WhatsApp Web
- **Dashboard** (React, puerto 2886) — interfaz web opcional

Nosotros solo usamos la **API**. El Dashboard no es necesario porque Django ya tiene su propia página para mostrar el QR.

### ¿Qué hace OpenWA por dentro?

OpenWA usa **whatsapp-web.js** que:
1. Abre Chromium invisible (Puppeteer)
2. Carga WhatsApp Web
3. Muestra código QR
4. Al escanearlo, vincula tu WhatsApp
5. A partir de ahí, permite enviar/recibir mensajes via API

### Paso a paso

#### 1. Abrir la página de QR

**http://localhost:8000/openwa/qr/**

Esto hace automáticamente:
```
Navegador → Django → OpenWA
  1. GET /api/sessions       (lista sesiones)
  2. POST /api/sessions      (crea "default" si no existe)
  3. POST /sessions/{id}/start (lanza Chromium)
  4. GET /sessions/{id}/qr   (obtiene QR)
  5. Muestra QR en pantalla  (refresco automático cada 5s)
```

#### 2. Escanear el QR

1. Abre WhatsApp en tu celular
2. Menú (3 puntos) → Dispositivos vinculados → Vincular un dispositivo
3. Escanea el QR que aparece en la página
4. Estado cambia a "connected"

#### 3. Probar envío

```bash
curl -X POST http://localhost:2785/api/sessions/vida-nueva/messages/send-text \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-admin-key" \
  -d '{"chatId": "593999999999@c.us", "text": "Hola, prueba"}'
```

El número debe ir en formato `593` + 9 dígitos + `@c.us`.

---

## API Key de OpenWA (auto-descubrimiento)

OpenWA genera una API key aleatoria al iniciar. El backend Django la descubre automáticamente:

```
OpenWA arranca
  └── escribe su API key en /app/data/.api-key
        │
        ▼
Volumen openwa_data montado en backend como /openwa_data:ro
        │
        ▼
Django lee /openwa_data/.api-key → OpenWAService usa esa key
```

**No necesitas configurar nada.** Ni buscar la key en logs, ni copiarla al `.env`.

### ¿Cómo funciona?

Archivo `notifications/openwa_db.py`:
```python
API_KEY_FILE = Path('/openwa_data/.api-key')

def get_api_key():
    if API_KEY_FILE.exists():
        return API_KEY_FILE.read_text().strip()
    return None
```

`OpenWAService` y `qr_view` llaman a `get_api_key()` primero. Si el archivo no existe (ej: desarrollo local), usan `settings.OPENWA_API_KEY` como fallback.

---

## Cómo funciona la página de QR en Django

Archivo: `notifications/views.py` — función `qr_view()`

```
1. GET /api/sessions          → lista sesiones
2. Busca "default"
3. Si no existe → POST /api/sessions {"name":"default"}
4. Si no está conectada → POST /sessions/{id}/start
5. GET /sessions/{id}/qr      → obtiene QR
6. Muestra QR o "iniciando..." con refresh cada 5s
```

Toda la comunicación usa `X-API-Key` (autodescubierta desde `.api-key`).

---

## Recordatorios automáticos

```bash
crontab -e
# Agregar:
*/5 * * * * cd /ruta && docker compose exec -T backend python3 manage.py send_call_reminders
```

Esto ejecuta `send_call_reminders` cada 5 minutos, que:
1. Revisa llamadas próximas a vencer
2. Calcula fracciones de tiempo (50%, 25%, 12.5%)
3. Envía WhatsApp al padre espiritual si no se ha enviado ya

---

## Integración Django → OpenWA

```
Django (8000)
  notifications/
  ├── openwa_db.py            → get_api_key() desde .api-key
  ├── services.py             → OpenWAService.send_text()
  ├── views.py                → qr_view()
  └── management/commands/
      └── send_call_reminders.py

       │ HTTP :2785
       ▼
OpenWA (2785)
  Sesión "default"
  ├── status: connected
  ├── whatsapp-web.js + Chromium
  └── chatId: 593999999999@c.us
```

---

## Apps del proyecto

| App | Contiene |
|---|---|
| `accounts` | Usuarios, roles, asesores, especialidades |
| `core` | Catálogos: país, ciudad, barrio, servicio |
| `persons` | Registro de personas + asignación automática |
| `calls` | Llamadas y detalle + semáforo |
| `baptisms` | Bautizos, clases, modalidades, acudientes |
| `dashboard` | Reportes y gráficas |
| `notifications` | Envío de WhatsApp, QR, webhook |

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `config/settings.py` | Configuración general de Django |
| `config/urls.py` | Define todas las rutas de la API |
| `config/router.py` | Filtra endpoints según el rol |
| `docker-compose.yml` | Define los 3 contenedores con vars del `.env` |
| `.env` | Variables de entorno (única fuente de verdad) |
| `manage.py` | Carga `.env` automáticamente via python-dotenv |
| `notifications/openwa_db.py` | Auto-descubre API key de OpenWA |
| `notifications/services.py` | Lógica para enviar WhatsApp |
| `notifications/views.py` | Página QR |
| `notifications/management/commands/send_call_reminders.py` | Recordatorios |
