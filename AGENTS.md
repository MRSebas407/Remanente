# App Iglesia — AGENTS.md

## Stack
- Django 6, DRF 3.17, SimpleJWT, PostgreSQL 16, WhiteNoise
- `AUTH_USER_MODEL = 'accounts.User'` (extends `AbstractUser`)
- Docker Compose (backend + db + openwa + dashboard services)
- OpenWA (`ghcr.io/rmyndharis/openwa`) for WhatsApp notifications
- OpenWA Dashboard (React SPA, built from repo, served via nginx on port 2886)

## Docker
```bash
docker compose build --no-cache   # after model changes
docker compose up
```
Startup runs: `collectstatic → migrate → seed_data → gunicorn`
Env via `.env` file (`cp .env.example .env`).  
Docker Compose references vars with `${VAR}`.  
python-dotenv loads `.env` in `manage.py` and `wsgi.py`.

OpenWA API at `http://localhost:2785`, Dashboard at `http://localhost:2886`.
First run: open `http://localhost:8000/openwa/qr/` or `http://localhost:2886` and scan QR.

## Apps & ownership

| App | Models | Purpose |
|---|---|---|
| `accounts` | User, RegisterUser, Role, Specialism, Adviser | Auth, roles, asesores |
| `core` | Country, City, Neighborhood, ChurchService | Catálogos geográficos/servicios |
| `persons` | Person (gender, specialism) | Registro de personas, asignación automática de padre espiritual + Call #1 |
| `calls` | Call, CallDetail | Llamadas (3 rondas) + semáforo; auto-creación de siguiente llamada al registrar |
| `baptisms` | BaptismalRegister, Attendant, Calendar, Mode, Class | Bautizos y clases |
| `dashboard` | — | Reportes para admin |
| `notifications` | Notification | Envío de recordatorios WhatsApp via OpenWA |

## Model chain
`User (login)` → `RegisterUser (datos personales)` → `Adviser (rol + especialidad)`  
`Person (nuevo miembro)` → `spiritual_father = Adviser` (role=Padre Espiritual)

## Seed users (auto-created)
| User | Pass | Role |
|---|---|---|
| admin | admin123 | Administrador |
| padre1 | 123456 | Padre Espiritual (Normal) |
| padre2 | 123456 | Padre Espiritual (Joven) |
| maestro1 | 123456 | Maestro |

Command: `python manage.py seed_data` — idempotent (skips if Role exists).

## API
Single `RoleBasedRouter` at `/api/` — API root filters endpoints by user role.
- `SessionAuthentication` + `JWT` both enabled. Browsable API login at `/api-auth/`.
- DRF pagination: 20/page (PageNumberPagination).

### Permission patterns
Role checks compare `adviser.role.name` as string (`'Administrador'`, `'Padre Espiritual'`, `'Maestro'`).  
Defined in `accounts/permissions.py` (`IsAdmin`, `IsSpiritualFather`, `IsTeacher`).  
`CallViewSet` uses `IsAdminOrSpiritualFather` (inline in `calls/views.py`).

### Queryset filtering by role
- **PersonViewSet**: Padre Espiritual → only `spiritual_father=adviser`. Maestro → only `baptized=False`.
- **CallDetailViewSet**: Padre Espiritual → only `made_by=adviser`.
- **BaptismalRegisterViewSet**: Maestro → only `teacher=adviser`.

## Business logic quirks

### Person creation auto-assigns spiritual father + auto-creates Call #1
In `PersonCreateSerializer.create()`:
1. Uses `person.specialism` directly → maps to Specialism name via `SPECIALISM_MAP`
2. Finds active Padre Espiritual with **matching specialism**, **same gender**, and `assigned_count < 3`
3. If found: sets `assignment_state='assigned'`, increments adviser's `assigned_count`
4. If **not found** (e.g. no same-gender father with that specialism/capacity): leaves `assignment_state='pending'` for manual admin assignment
5. Creates Call #1 with CallDetail: `scheduled_date = now + 5min` (testing), `made_by = adviser` (or `registered_by` if no father assigned)

### Person model fields
- `specialism` replaces `is_young`: choices are `joven`, `normal`, `other_church`, `distance`
- `comes_from` eliminated — replaced by `specialism` field directly
- `comes_from_church` and `comes_from_details` visible only when `specialism == "Otra Iglesia"`
- `assignment_state`: `pending`, `assigned` (auto-set on creation, tracks spiritual father assignment)
- `member_state`: `effective`, `not_effective` (default `not_effective`, auto-changes to `effective` when 3rd call recorded AND all 3 calls have state='effective')
- Both states are read-only in the API (admin can override via PUT/PATCH to Person endpoint)

### Call scheduling
Call #1 created on person creation with `scheduled_date = now + 5min` (testing).
When `record_call` is called:
- Updates the existing pending CallDetail (annotation, state, signature)
- Sets `made=True`, `date_made=now`
- If `call_number < 3`: auto-creates next Call + CallDetail with `scheduled_date = now + 10min` (call #2) or `+15min` (call #3)

### Semaphore (traffic light) in pending_calls
`GET /api/calls/pending_calls/` computes `color` per call:
- green > 50%, yellow 25-50%, orange 0-25%, red ≤ 0% time remaining

### Admin override for assign_spiritual_father
`POST /api/persons/{id}/assign_spiritual_father/` returns `warnings` + `requires_override: true` if restrictions violated. Pass `override: true` to force.

### CallDetail record flow
- `record_call` action (not direct POST to /api/call-details/): finds existing pending CallDetail, updates it, auto-creates next call
- `CallDetailViewSet` returns details but `record_call` is the primary way to record calls

## Serializer switching
Several viewsets switch serializers by action:
- `PersonViewSet`: `create` → `PersonCreateSerializer`, `list` → `PersonListSerializer`, else → `PersonSerializer`
- `CallViewSet`: always uses `CallSerializer` (no manual create; auto-created via `record_call`)
- `AdviserViewSet`: `list` → `AdviserListSerializer`, else → `AdviserSerializer`

## Image uploads
Signatures and photos use `ImageField`. Sent as `multipart/form-data`. Stored in `media/` (mounted as Docker volume).

## Testing
No tests exist. No CI. No linter/formatter config.

## Key config files
- `config/settings.py` — Django settings, DRF, JWT, CORS, WhiteNoise
- `config/urls.py` — single `RoleBasedRouter` with all endpoints
- `config/router.py` — `RoleBasedRouter` subclass filtering API root by role
- `docker-compose.yml` — `db` + `openwa` + `dashboard` + `backend` services, references vars via `${VAR}` from `.env`
- `Dockerfile.dashboard` — Clones OpenWA repo, builds React SPA, serves via nginx on port 2886
- `.gitignore` — excludes `.env`, `venv/`, `*.db`, `media/`, `staticfiles/`

## WhatsApp notifications (OpenWA)
- OpenWA service on port 2785 (API), Dashboard on port 2886 (React SPA served by nginx).
- **API key**: Set via `API_MASTER_KEY=dev-admin-key` in docker-compose. Django auto-discovers from `/openwa_data/.api-key`. `.env` is fallback only.
- Session name: `vida-nueva` (configured in `.env` as `OPENWA_SESSION_ID`).
- QR at `http://localhost:8000/openwa/qr/` or `http://localhost:2886` (auto-creates session, starts it, shows QR with auto-refresh).
- Reminder management command: `python manage.py send_call_reminders`
  - Sends 3 reminders per CallDetail at fractions of total time (50%, 25%, 12.5%)
  - Message: `"Hola {adviser}, te recordamos que tienes un tiempo de {tiempo} para llamar a {person} - Llamada #{call_number}"`
  - Tracks via `Notification` model to avoid duplicates
- Recommended cron schedule: every 5 minutes (`*\/5 * * * *`)
- Config in `.env`: `OPENWA_BASE_URL`, `OPENWA_API_KEY` (fallback), `OPENWA_SESSION_ID`
- Volume `openwa_data` mounted in backend as `/openwa_data:ro` for auto-discovery
- Healthcheck configured on openwa service

## Shared/utility modules
- `frontend/src/app/shared/core.service.ts` — `CoreService`: CRUD for Country, City, Neighborhood, ChurchService via `/api/countries/`, `/api/cities/`, `/api/neighborhoods/`, `/api/services/`
- `frontend/src/app/shared/assign-father.ts` — `AssignFather` modal: lists active Padre Espiritual advisers, allows selection, handles warnings/override flow
- `frontend/src/app/shared/core-manager.ts` — `CoreManager` modal: tabbed CRUD interface for countries (name), cities (name + country FK), neighborhoods (name + city FK), services (name + description + is_active); accessible via "Catálogos" button in admin sidebar
- `frontend/src/app/persons/person-list.ts` — Uses `AssignFather` modal instead of `prompt()` for assign_spiritual_father; `assignFatherPerson` signal controls modal visibility
