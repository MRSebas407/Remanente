# AGENTS.md

## Stack
- Django 6, DRF 3.17, SimpleJWT, PostgreSQL 16, WhiteNoise
- `AUTH_USER_MODEL = 'accounts.User'` (extends `AbstractUser`, adds `must_change_password=True` default)
- Docker Compose (4 services: `db` + `openwa` + `dashboard` + `backend`)
- OpenWA (`ghcr.io/rmyndharis/openwa`) for WhatsApp — API on `:2785`, Dashboard on `:2886`

## Docker
```bash
docker compose build --no-cache   # after model changes
docker compose up
```
Startup CMD order: `collectstatic → migrate → seed_data → gunicorn`.  
Env via `.env` (`cp .env.example .env`). `manage.py` and `wsgi.py` both load it via python-dotenv.  
Docker Compose resolves `${VAR}` from `.env` automatically.

First run: open `http://localhost:8000/openwa/qr/` or `http://localhost:2886` and scan QR.

## Apps

| App | Key models | Purpose |
|---|---|---|
| `accounts` | User, RegisterUser, Role, Specialism, Adviser | Auth, roles, asesores |
| `core` | Country, City, Neighborhood, ChurchService | Catálogos geográficos/servicios |
| `persons` | Person (gender, specialism, assignment_state, member_state) | Registro de personas, auto-asignación padre espiritual + Call #1 |
| `calls` | Call (`unique_together=['person','call_number']`), CallDetail | Llamadas (3 rondas) + semáforo |
| `baptisms` | BaptismalRegister, Attendant, Calendar, Mode, Class | Bautizos y clases |
| `dashboard` | — | Reportes para admin |
| `notifications` | Notification | Envío WhatsApp via OpenWA |

## Seed users
`python manage.py seed_data` — idempotent (skips if Role exists).  
admin/admin123, padre1/123456 (Normal, M), padre2/123456 (Joven, F), maestro1/123456.

## API
Single `RoleBasedRouter` at `/api/` — API root hides endpoints by role (see `config/router.py`).  
SessionAuthentication + JWT. Browsable API at `/api-auth/`.  
Pagination: `FlexiblePageNumberPagination` (default 20/page, accepts `?page_size=` param, max 99999).

## Permissions
- `accounts/permissions.py`: `IsAdmin`, `IsSpiritualFather`, `IsTeacher`, `IsAdminOrRead`
- `calls/views.py`: `IsAdminOrSpiritualFather` (allows POST/PUT/PATCH for Padre Espiritual)
- Role checks compare `adviser.role.name` as string (`'Administrador'`, `'Padre Espiritual'`, `'Maestro'`)

### Queryset filtering by role
- **PersonViewSet**: Padre Espiritual & Maestro both → `spiritual_father=adviser`
- **CallDetailViewSet**: Padre Espiritual → `made_by=adviser`
- **BaptismalRegisterViewSet**: Maestro → `teacher=adviser`

### Custom actions
- `POST /api/persons/{id}/assign_spiritual_father/` — override via `{adviser_id, override:true}`
- `POST /api/persons/{id}/enroll_fundamentals/` — transfers person from Padre Espiritual to Maestro
- `POST /api/persons/{id}/mark_baptized/` — creates BaptismalRegister, clears spiritual_father
- `POST /api/calls/{id}/record_call/` — records pending CallDetail, auto-creates next call
- `GET /api/calls/pending_calls/` — semaphore (green>50%, yellow 25-50%, orange 0-25%, red≤0%)
- `GET /api/calls/all_calls/` — full list with filters: `name`, `made_by`, `state` (pending/effective/not_effective), `page_size`
- `GET /api/profile/me/` + PUT/PATCH + `POST /api/profile/change_password/`
- `POST /api/advisers/{id}/reset_password/` — resets to document number
- `GET /api/dashboard/?period=monthly|weekly|annual&start_date=&end_date=`
- `GET /api/dashboard/my_stats/` — adviser's own stats (admin sees all)
- `POST /api/baptisms/quick_register/` — quick baptismal register with `person_id`

## Serializer switching
| ViewSet | create | list | retrieve | else |
|---|---|---|---|---|
| PersonViewSet | PersonCreateSerializer | PersonListSerializer | PersonDetailSerializer | PersonSerializer |
| AdviserViewSet | AdviserSerializer | AdviserListSerializer | — | AdviserSerializer |
| BaptismalRegisterViewSet | — | BaptismalRegisterListSerializer | — | BaptismalRegisterSerializer |
| CallViewSet | CallCreateSerializer (admin only) | — | — | CallSerializer |
- Catálogos (Role, Specialism, Attendant, Calendar, Mode, Class) use `pagination_class = None`
- AdviserViewSet excludes Administrador from queryset; supports filters: `search`, `name`, `document`, `phone`, `role_name`, `is_active`

## Business logic

### Person creation (PersonCreateSerializer.create)
1. Maps `person.specialism` → Specialism name via `SPECIALISM_MAP` (`joven→Joven`, `normal→Normal`, `other_church→Normal`, `distance→Normal`)
2. Finds active Padre Espiritual with matching specialism, same gender, `assigned_count < 3`
3. If found: `assignment_state='assigned'`, increments `assigned_count`. Else: `'pending'` for manual admin assignment
4. Creates Call #1 + CallDetail: `scheduled_date = now + 5min` (testing shortcut — production should be 48h)
5. Sends WhatsApp notification to assigned father

### Call recording flow (`record_call`)
- Updates existing pending CallDetail (annotation, state, signature), sets `made=True`, `date_made=now`
- Only if `state='effective'`: creates next Call + CallDetail (calls #1→#2, #2→#3), notifies adviser
- If `state='not_effective'`: stops — no next call is created, no notification
- Call #3 determines the final state:
  - If `state='effective'`: `member_state='effective'`, decrements `assigned_count`, notifies adviser
  - If `state='not_effective'`: `member_state='not_effective'`, `assignment_state='deactivated'`, `is_active=False`, decrements `assigned_count`, clears `spiritual_father`

### Call editing (CallDetailViewSet.perform_update)
- Adviser (Padre Espiritual) can edit their own call details (state, annotation)
- **When editing `not_effective` → `effective`**:
  - If call #1 or #2 and next Call doesn't exist: auto-creates next Call + CallDetail
  - If call #3: sets `member_state='effective'`, `is_active=True`, `assignment_state='completed'`, decrements `assigned_count`

### Person state fields (read-only in API, admin can override via PUT/PATCH)
- `specialism`: `joven`, `normal`, `other_church`, `distance`
- `comes_from_church`/`comes_from_details` visible only when `specialism == "other_church"`
- `assignment_state`: `pending`, `assigned`, `completed`, `deactivated`
- `member_state`: `effective`, `not_effective` (default, changes to `effective` on 3rd successful call, stays `not_effective` if any call fails)
- `data_consent`: boolean field

### enroll_fundamentals flow
- Requires `member_state='effective'` and `enrollment_fund_1=False`
- Sets `enrollment_fund_1=True`, decrements old father's `assigned_count`, reassigns `spiritual_father` to first active Maestro
- Notifies new Maestro via WhatsApp

### assign_spiritual_father flow (admin)
- Validates specialism, gender match, capacity < 3
- Returns `409` with `warnings` + `requires_override: true` on violation; pass `override: true` to force
- Reassigns pending CallDetail or creates new one if needed

## OpenWA WhatsApp
- API key auto-discovered from `/openwa_data/.api-key` (mounted volume), fallback to `settings.OPENWA_API_KEY`
- `OPENWA_COUNTRY_CODE` defaults to `'57'` (Colombia)
- QR page at `http://localhost:8000/openwa/qr/` — auto-creates/restarts session, shows QR with 5s refresh
- Webhook at `POST /api/openwa/webhook/` (csrf_exempt, logs events)
- Reminder command: `python manage.py send_call_reminders` — 3 reminders per CallDetail at 50%, 25%, 12.5% of total time; recommended cron `*/5 * * * *`

## Image uploads
Signatures and photos use `ImageField`. Sent as `multipart/form-data`. Stored in `media/` (Docker volume).

## Dev without Docker
```bash
python -m venv venv; .\venv\Scripts\activate  # Windows
pip install -r requirements.txt
# .env: DB_HOST=localhost
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

## Key files
- `config/settings.py` — Django settings, JWT (1d access, 7d refresh), pagination, OpenWA config
- `config/urls.py` — all route registration
- `config/router.py` — RoleBasedRouter (filters API root by role)
- `config/pagination.py` — FlexiblePageNumberPagination
- `accounts/permissions.py` — role-based permission classes
- `notifications/openwa_db.py` — auto-discovers OpenWA API key
- `notifications/services.py` — OpenWAService (send_text, notify_assignment, etc.)
