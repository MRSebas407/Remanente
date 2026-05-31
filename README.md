# App Iglesia

Sistema de gestión para iglesias — seguimiento de nuevos miembros, llamadas de discipulado, bautizos y reportes.

## Tecnologías

- **Backend:** Django 6 + Django REST Framework
- **Autenticación:** JWT (SimpleJWT)
- **Base de datos:** PostgreSQL 16
- **WhatsApp:** OpenWA (API auto-hosted)
- **Frontend:** Angular 20 + TailwindCSS
- **Contenedores:** Docker + Docker Compose

## Requisitos

- Docker y Docker Compose instalados

## Configuración rápida

### 1. Configurar variables de entorno

```bash
cp .env.example .env
```

### 2. Levantar los contenedores

```bash
docker compose up --build
```

Esto levanta 4 servicios:

| Servicio | Puerto | Descripción |
|---|---|---|
| `db` | 5432 | PostgreSQL |
| `openwa` | 2785 | API de WhatsApp |
| `dashboard` | 2886 | Dashboard web de OpenWA |
| `backend` | 8000 | API Django |

Al iniciar, el backend ejecuta automáticamente:
1. Migraciones de base de datos
2. Seed data (roles, especialidades, país, usuarios)
3. Gunicorn (servidor web)

### 3. Verificar

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. Conectar WhatsApp

**Opción A — Dashboard OpenWA:** `http://localhost:2886` (gestión visual completa)  
**Opción B — Django QR:** `http://localhost:8000/openwa/qr/` (solo escanear QR)

## Datos iniciales

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | admin123 | Administrador |
| padre1 | 123456 | Padre Espiritual |
| padre2 | 123456 | Padre Espiritual (Joven) |
| maestro1 | 123456 | Maestro |

## API Endpoints

Todas las rutas bajo `http://localhost:8000/api/`.

### Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login/` | Iniciar sesión |
| POST | `/api/auth/register/` | Registrar nuevo asesor |
| GET | `/api/users/me/` | Perfil del usuario actual |

### Catálogos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/roles/` | Listar roles |
| GET | `/api/specialisms/` | Listar especialidades |
| GET | `/api/countries/` | Listar países |
| GET | `/api/cities/?country=1` | Listar ciudades por país |
| GET | `/api/neighborhoods/?city=1` | Listar barrios por ciudad |
| GET | `/api/services/` | Listar servicios |

### Personas

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/persons/` | Listar personas |
| POST | `/api/persons/` | Registrar persona (asignación automática de padre espiritual) |
| POST | `/api/persons/{id}/assign_spiritual_father/` | Reasignar padre espiritual (admin) |
| POST | `/api/persons/{id}/enroll_fundamentals/` | Inscribir a Fundamentos 1 |
| POST | `/api/persons/{id}/mark_baptized/` | Marcar bautizado |

### Llamadas

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/calls/?person=1` | Listar llamadas de una persona |
| POST | `/api/calls/` | Crear llamada (genera detalle con fecha programada) |
| GET | `/api/calls/pending_calls/` | Llamadas pendientes con semáforo |
| POST | `/api/calls/{id}/record_call/` | Registrar detalle de llamada |

### Bautizos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/baptisms/` | Listar registros bautismales |
| POST | `/api/baptisms/` | Crear registro bautismal |
| GET | `/api/baptisms/pending_baptisms/` | Personas pendientes de bautizar |
| GET | `/api/attendants/` | Listar acudientes |
| GET | `/api/calendars/` | Listar horarios de clase |
| GET | `/api/modes/` | Listar modalidades |
| GET | `/api/classes/` | Listar clases |

### Dashboard (solo admin)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/dashboard/?period=monthly` | Reporte (weekly/monthly/annual) |

## Lógica de negocio

### Asignación de padre espiritual

Al registrar una persona, el sistema asigna automáticamente un padre espiritual según:
1. **Especialidad:** coincide con el tipo de persona (Joven → especialidad Joven, etc.)
2. **Género:** mismo género que la persona
3. **Capacidad:** máximo 3 personas por padre espiritual

### Calendario de llamadas

| Llamada | Plazo |
|---|---|
| Primera | 48 horas desde el registro |
| Segunda | 8 días después de la primera |
| Tercera | 8 días después de la segunda |

### Semáforo

| Color | Tiempo restante |
|---|---|
| Verde | Más del 50% |
| Amarillo | 25% – 50% |
| Naranja | 0% – 25% |
| Rojo | Tiempo cumplido |

### Recordatorios WhatsApp

Se envían 3 avisos al padre espiritual en fracciones del tiempo total:
- **Aviso 1:** 50% del tiempo restante
- **Aviso 2:** 25% del tiempo restante
- **Aviso 3:** 12.5% del tiempo restante

Ejecutar cada 5 minutos via cron:
```
*/5 * * * * cd /ruta && docker compose exec -T backend python3 manage.py send_call_reminders
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `DEBUG` | True | Modo debug |
| `SECRET_KEY` | — | Clave secreta de Django |
| `DJANGO_ALLOWED_HOSTS` | * | Hosts permitidos |
| `DB_NAME` | appiglesia | Nombre BD |
| `DB_USER` | appiglesia | Usuario BD |
| `DB_PASSWORD` | appiglesia | Contraseña BD |
| `DB_HOST` | db | Host BD |
| `DB_PORT` | 5432 | Puerto BD |
| `OPENWA_BASE_URL` | http://openwa:2785/api | URL de OpenWA |
| `OPENWA_API_KEY` | — | Fallback (se autodescubre) |
| `OPENWA_SESSION_ID` | default | Nombre de sesión OpenWA |

## Desarrollo sin Docker

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Ajustar .env: DB_HOST=localhost
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

## Frontend (Angular 20)

```bash
cd frontend
npm install     # solo la primera vez
ng serve        # http://localhost:4200
```

El frontend espera la API en `http://localhost:8000` (proxy configurado en `angular.json`).

### Build producción

```bash
ng build
python serve.py 4200   # sirve dist/ en http://localhost:4200
```
