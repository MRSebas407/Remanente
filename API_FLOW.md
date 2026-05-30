# API — Flujo completo para Frontend

## 1. Autenticación

### Login
```http
POST /api/auth/login/
Body: { "username": "admin", "password": "admin123" }
Response: {
  "access": "<jwt>",
  "refresh": "<jwt>",
  "user": { "id": 1, "username": "admin", "email": "...", "role": "Administrador", "adviser_id": 1 }
}
```
Guardar `access` y enviar en cada request como `Authorization: Bearer <token>`.
`role` determina qué vistas tiene el usuario. `adviser_id` se necesita para `registered_by` y `made_by`.

### Login con sesión (browsable API)
`/api-auth/login/` — formulario de login de DRF para usar la API desde el navegador.

### Registro de nuevo asesor (solo admin)
```http
POST /api/auth/register/
Body: {
  "username": "nuevo",
  "password": "...",
  "names": "...",
  "last_name": "...",
  "document": "...",
  "phone": "...",
  "gender": "M",              // M | F
  "role_id": 2,               // 1=Admin, 2=Padre Espiritual, 3=Maestro
  "specialism_id": 1,         // opcional, solo para Padre Espiritual
  "signature": <file>,        // opcional
  "photo": <file>             // opcional
}
```

---

## 2. API Root por rol

La raíz `/api/` filtra los endpoints según el rol del usuario autenticado:

| Rol | Endpoints visibles |
|---|---|
| **Administrador** | Todos |
| **Padre Espiritual** | specialisms, countries, cities, neighborhoods, services, persons, calls, call-details |
| **Maestro** | specialisms, countries, cities, neighborhoods, services, users, baptisms, attendants, calendars, modes, classes |
| **No autenticado** | Solo auth |

---

## 3. Catálogos (CRUD completo)

Cualquier usuario autenticado puede crear/leer/actualizar/eliminar.  
El frontend debe permitir crear inline si no existe el valor (ej: agregar barrio desde el formulario de persona).

| Endpoint | Descripción | Filtro |
|---|---|---|
| `GET/POST /api/countries/` | Listar / Crear país | — |
| `GET/POST /api/cities/` | Listar / Crear ciudad | `?country=1` |
| `GET/POST /api/neighborhoods/` | Listar / Crear barrio | `?city=1` |
| `GET/POST /api/services/` | Listar / Crear servicio | — |
| `GET/POST /api/specialisms/` | Listar / Crear especialidad | — |
| `GET /api/roles/` | Listar roles (solo lectura) | — |

### Flujo para crear persona con catálogos
1. Si no existe país → `POST /api/countries/` → obtener `id`
2. Si no existe ciudad → `POST /api/cities/` (con `country: id`) → obtener `id`
3. Si no existe barrio → `POST /api/neighborhoods/` (con `city: id`) → obtener `id`
4. Si no existe servicio → `POST /api/services/` → obtener `id`
5. `POST /api/persons/` con todos los `id`s

---

## 4. Asesores (solo admin)

| Método | Endpoint |
|---|---|
| GET | `/api/advisers/` |
| POST | `/api/advisers/` |
| GET/PUT/DELETE | `/api/advisers/{id}/` |

Al crear asesores se usa `POST /api/auth/register/` en vez del endpoint de advisers.

---

## 5. Personas

### Crear persona
```http
POST /api/persons/
Body: {
  "names": "Juan",
  "lastname": "Pérez",
  "document": "1234567890",
  "phone": "0999999999",
  "gender": "M",                    // M | F — usado para asignar padre espiritual
  "country": 1,
  "city": 1,
  "neighborhood": 1,
  "address": "Calle 123",
  "church_service": 1,
  "comes_from": "normal",           // other_church | young | normal | distance
  "comes_from_church": null,        // si comes_from = other_church
  "comes_from_details": null,
  "registered_by": 1,               // adviser_id del que registra
  "signature": <file>,              // opcional
  "is_young": false,
  "enrollment_fund_1": false,
  "baptized": false
}
```

**Respuesta:** la persona se crea con `state: "assigned"` o `"unassigned"` y `spiritual_father` asignado automáticamente por:
1. Especialidad según `comes_from` (young→Joven, other_church→Otra Iglesia, etc.)
2. Género (mismo género que la persona)
3. Cupo disponible (< 3 asignados)

### Asignación manual (admin)
```http
POST /api/persons/{id}/assign_spiritual_father/
Body: { "adviser_id": 5 }
# Si hay advertencias → 409 Conflict:
{ "warnings": ["El género no coincide", ...], "requires_override": true }
# Forzar:
{ "adviser_id": 5, "override": true }
```

### Otras acciones
```http
POST /api/persons/{id}/enroll_fundamentals/
POST /api/persons/{id}/mark_baptized/
```

### Filtros por rol
- **Admin:** todas
- **Padre espiritual:** solo `spiritual_father = yo`
- **Maestro:** solo `baptized = false`

---

## 6. Llamadas

### Crear llamada (genera detalle con fecha programada)
```http
POST /api/calls/
Body: { "person": 1, "call_number": 1 }   # 1 | 2 | 3
```

| call_number | Plazo desde creación |
|---|---|
| 1 | 48 horas |
| 2 | 8 días |
| 3 | 8 días |

### Registrar llamada realizada
```http
POST /api/calls/{id}/record_call/
Body (multipart/form-data si incluye firma):
{
  "made_by": 5,
  "annotation": "Hablamos...",
  "state": "effective",       # effective | not_effective
  "signature": <file>         # opcional
}
```

### Llamadas pendientes con semáforo
```http
GET /api/calls/pending_calls/
Response: [
  {
    "detail_id": 1,
    "person_id": 1,
    "person_name": "Juan Pérez",
    "call_number": 1,
    "scheduled_date": "2026-05-30T12:00:00Z",
    "remaining_hours": 24.5,
    "color": "yellow"
  }
]
```

| Color | Tiempo restante |
|---|---|
| 🟢 Verde | > 50% |
| 🟡 Amarillo | 25% – 50% |
| 🟠 Naranja | 0% – 25% |
| 🔴 Rojo | ≤ 0% |

---

## 7. Bautizos

### Crear registro bautismal
```http
POST /api/baptisms/
Body (multipart/form-data si incluye foto):
{
  "person": 1,
  "teacher": 5,
  "age": 25,
  "attendant": 1,
  "class_ref": 1,
  "baptism_decision": "yes",     // yes | no | undecided
  "photo": <file>,
  "shirt_size": "M",
  "time_in_church": "3 meses",
  "baptized": false,
  "details": "..."
}
```

### Personas pendientes de bautizar
```http
GET /api/baptisms/pending_baptisms/
Response: [{ "person_id": 1, "person_name": "...", "document": "...", "phone": "..." }]
```

### Catálogos de bautizos
| Endpoint | Descripción |
|---|---|
| `GET/POST /api/attendants/` | Acudientes |
| `GET/POST /api/calendars/` | Horarios de clase |
| `GET/POST /api/modes/` | Modalidades (Virtual, Presencial templo, Presencial Grupo vida) |
| `GET/POST /api/classes/` | Clases (requiere calendar, professor, mode) |

### Filtro por rol
- **Maestro:** solo ve registros donde `teacher = yo`

---

## 8. Dashboard (solo admin)

```http
GET /api/dashboard/?period=monthly
GET /api/dashboard/?period=weekly
GET /api/dashboard/?period=annual
GET /api/dashboard/?start_date=2026-01-01&end_date=2026-12-31

Response: {
  "total_registered": 50,
  "new_people": 30,          // excluye comes_from=other_church
  "effective": 20,            // state = effective
  "baptized": 10,
  "period": "monthly",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-12-31T00:00:00Z"
}
```

---

## 9. Roles y permisos

| Recurso | Administrador | Padre Espiritual | Maestro |
|---|---|---|---|
| Catálogos (país, ciudad, etc.) | CRUD | CRUD | CRUD |
| Asesores | CRUD | ✗ | ✗ |
| Personas | CRUD | Crear + ver asignados | Ver no bautizados |
| Llamadas | CRUD | Ver + registrar asignadas | ✗ |
| Bautizos | CRUD | ✗ | CRU |
| Dashboard | ✓ | ✗ | ✗ |

---

## 10. Flujo completo de miembro nuevo

```
Registrar persona (POST /api/persons/)
  │
  ▼
Asignación automática de Padre Espiritual (por especialidad + género + cupo)
  │
  ├─ state: "assigned" + spiritual_father asignado
  └─ state: "unassigned" si no hay cupo (admin puede reasignar manualmente)
  │
  ▼
Crear Call #1 → CallDetail programado a 48h
  │
  ▼
Padre Espiritual ve llamada pendiente (GET /api/calls/pending_calls/)
  │
  ▼
Padre Espiritual llama → POST /api/calls/{id}/record_call/
  │
  ▼
Crear Call #2 → CallDetail programado a 8 días
  │
  ▼
Padre Espiritual llama → POST /api/calls/{id}/record_call/
  │
  ▼
Crear Call #3 → CallDetail programado a 8 días
  │
  ▼
Padre Espiritual llama → POST /api/calls/{id}/record_call/
  │
  ▼
Admin/Padre marca persona como efectiva (actualiza state)
Admin inscribe a Fundamentos 1 (POST /api/persons/{id}/enroll_fundamentals/)
  │
  ▼
Admin marca baptized = true (o lo deja en false para que el Maestro actúe)
  │
  ▼
Maestro ve persona en GET /api/baptisms/pending_baptisms/
Maestro crea registro bautismal → POST /api/baptisms/
  │
  ▼
Persona bautizada ✅
```

---

## 11. Tips para frontend

1. **JWT** — guardar en localStorage. Enviar como `Authorization: Bearer <token>`. Renovar con `POST /api/auth/refresh/` con el `refresh` token.
2. **Rol del usuario** — viene en `user.role` del login. Usarlo para ocultar/mostrar secciones completas.
3. **Catálogos inline** — cargar selects al abrir formulario. Si falta un valor, mostrar modal para crearlo con su respectivo `POST`.
4. **Cascada** — `Country` → `City` → `Neighborhood`. Al cambiar país, recargar ciudades con `?country=id`.
5. **Imágenes** — firmas y fotos se envían como `multipart/form-data`.
6. **Semáforo** — el color viene calculado del backend. Solo mostrar el indicador visual (círculo coloreado).
7. **adviser_id** — necesario para `registered_by` (personas) y `made_by` (llamadas). Se obtiene del login.
8. **Fechas** — el backend usa `America/Guayaquil` (UTC-5). Enviar/recibir en formato ISO 8601.
