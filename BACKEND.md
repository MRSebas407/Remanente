# BACKEND - Tutorial Completo

Bienvenido a la documentación del backend de esta aplicación. Aquí aprenderás cómo funciona todo, desde la configuración inicial hasta el flujo completo de cada funcionalidad.

## Índice

1. [Introducción](#1-introducción)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Configuración paso a paso](#3-configuración-paso-a-paso)
4. [Base de datos: los modelos](#4-base-de-datos-los-modelos)
5. [Autenticación (Auth)](#5-autenticación-auth)
6. [Permisos: quién puede hacer qué](#6-permisos-quién-puede-hacer-qué)
7. [Registro de personas](#7-registro-de-personas)
8. [Llamadas de seguimiento](#8-llamadas-de-seguimiento)
9. [Bautizos](#9-bautizos)
10. [Dashboard y reportes](#10-dashboard-y-reportes)
11. [OpenWA: notificaciones WhatsApp](#11-openwa-notificaciones-whatsapp)
12. [Flujo completo](#12-flujo-completo)

---

## 1. Introducción

### ¿Qué hace esta aplicación?

Esta es una aplicación para que iglesias puedan **registrar personas** que asisten, **asignarles un asesor espiritual** (como un Padrino o Mentor), hacer un **seguimiento de 3 llamadas** para conocer su estado, y eventualmente **inscribirlos a clases de fundamentos bíblicos** y **registrar su bautizo**.

### Roles de usuario

| Rol | ¿Qué puede hacer? |
|---|---|
| **Administrador** | Todo: crear personas, asignar asesores, ver reportes, gestionar usuarios |
| **Padre Espiritual** | Ver sus personas asignadas, hacer llamadas de seguimiento, inscribir a fundamentos |
| **Maestro** | Ver personas inscritas a fundamentos, gestionar bautizos |

### Tecnologías usadas

- **Python 3.12** con **Django 5** — el framework web
- **Django REST Framework (DRF)** — para crear la API REST
- **SimpleJWT** — para autenticación con tokens
- **PostgreSQL 16** — la base de datos
- **Docker** — para ejecutar todo en contenedores
- **OpenWA** — para enviar mensajes por WhatsApp
- **WhiteNoise** — para servir archivos estáticos

---

## 2. Estructura del proyecto

```
appIglesia/                    # Carpeta raíz del proyecto
├── manage.py                  # Punto de entrada de Django (el que ejecuta comandos)
├── requirements.txt           # Lista de dependencias de Python
├── Dockerfile                 # Instrucciones para crear la imagen Docker
├── docker-compose.yml         # Define los 4 servicios (db, openwa, dashboard, backend)
├── AGENTS.md                  # Instrucciones para la IA que ayuda a programar
│
├── config/                    # Configuración principal de Django
│   ├── __init__.py
│   ├── settings.py            # Donde se configura toda la app
│   ├── urls.py                # Las rutas (endpoints) de la API
│   ├── router.py              # El enrutador que filtra por rol
│   ├── pagination.py          # Cómo se pagina la información
│   └── wsgi.py                # Para el servidor web
│
├── accounts/                  # Autenticación, roles, asesores
│   ├── models.py              # User, Role, Specialism, RegisterUser, Adviser
│   ├── serializers.py         # Cómo se convierten los datos a JSON
│   ├── views.py              # La lógica de cada endpoint
│   ├── permissions.py         # Quién puede acceder a qué
│   └── management/commands/   # Comandos especiales
│       ├── seed_data.py       # Crea datos iniciales
│       └── seed_demo.py       # Crea datos de prueba
│
├── core/                      # Catálogos (países, ciudades, servicios)
│   ├── models.py              # Country, City, Neighborhood, ChurchService
│   └── views.py               # Endpoints simples de solo lectura/escritura
│
├── persons/                   # Registro de personas
│   ├── models.py              # El modelo Person (la persona registrada)
│   ├── serializers.py         # Cómo se crea, lista y detalla una persona
│   └── views.py               # La lógica: crear, stats, asignar padre
│
├── calls/                     # Llamadas de seguimiento
│   ├── models.py              # Call y CallDetail
│   ├── serializers.py         # Cómo se serializan las llamadas
│   └── views.py               # record_call, pending_calls, all_calls
│
├── baptisms/                  # Bautizos
│   ├── models.py              # BaptismalRegister, Attendant, etc.
│   ├── serializers.py
│   └── views.py               # CRUD y quick_register
│
├── dashboard/                 # Reportes y estadísticas
│   ├── services.py            # La lógica de agregación de datos
│   └── views.py               # Endpoints de reportes
│
├── notifications/             # WhatsApp vía OpenWA
│   ├── models.py              # Modelo Notification (historial)
│   ├── services.py            # OpenWAService (la clase que envía mensajes)
│   ├── openwa_db.py           # Cómo leer la clave API de OpenWA
│   └── views.py               # Webhook y página QR
│
├── media/                     # Fotos y firmas subidas por usuarios
└── staticfiles/               # Archivos estáticos (CSS, JS)
```

### Explicación de la estructura

Cuando Django arranca, sigue este orden:

1. **manage.py** recibe el comando y carga la configuración
2. **config/settings.py** se ejecuta y configura todo (base de datos, apps, seguridad)
3. **config/urls.py** define qué URL lleva a qué vista
4. Cada **app** (accounts, persons, calls, etc.) tiene sus propios modelos, vistas y serializadores

---

## 3. Configuración paso a paso

### 3.1 Variables de entorno (`.env`)

Creamos un archivo llamado `.env` en la raíz del proyecto. Este archivo guarda configuraciones secretas como contraseñas. Django lo lee automáticamente.

```
DEBUG=True
SECRET_KEY=clave-secreta-aqui
DB_NAME=appiglesia
DB_USER=appiglesia
DB_PASSWORD=appiglesia
DB_HOST=db
DB_PORT=5432

OPENWA_BASE_URL=http://openwa:2785/api
OPENWA_API_KEY=dev-admin-key
OPENWA_SESSION_ID=default
OPENWA_COUNTRY_CODE=57
```

**Explicación de cada variable:**

- `DEBUG=True`: en desarrollo vemos errores detallados, en producción se pone `False`
- `SECRET_KEY`: clave secreta de Django (como una contraseña maestra)
- `DB_*`: configuración de la base de datos PostgreSQL. `DB_HOST=db` porque el servicio de base de datos se llama "db" dentro de Docker
- `OPENWA_BASE_URL`: la dirección del servicio OpenWA. Dentro de Docker es `http://openwa:2785/api`
- `OPENWA_API_KEY`: clave para autenticarse en OpenWA
- `OPENWA_SESSION_ID`: nombre de la sesión de WhatsApp (podemos tener varias)
- `OPENWA_COUNTRY_CODE`: código del país para los números de teléfono (57 = Colombia)

### 3.2 Docker (`docker-compose.yml`)

Docker nos permite ejecutar la aplicación en "contenedores" (como cajitas aisladas). Cada servicio corre en su propio contenedor.

```yaml
services:
  db:                     # Base de datos PostgreSQL
    image: postgres:16
    environment:
      POSTGRES_DB: appiglesia
      POSTGRES_USER: appiglesia
      POSTGRES_PASSWORD: appiglesia
    volumes:
      - postgres_data:/var/lib/postgresql/data

  openwa:                 # WhatsApp API
    image: ghcr.io/rmyndharis/openwa:latest
    ports:
      - "2785:2785"
    environment:
      NODE_ENV: development
      PORT: 2785
      API_MASTER_KEY: dev-admin-key
    volumes:
      - openwa_data:/app/data

  dashboard:              # Panel de control de OpenWA
    image: ghcr.io/rmyndharis/openwa:latest
    ports:
      - "2886:2886"
    # ...

  backend:                # Nuestra aplicación Django
    build: .
    ports:
      - "8000:8000"
    environment:
      DB_HOST: db
    volumes:
      - openwa_data:/openwa_data:ro    # Lee la clave API de OpenWA
      - media_data:/app/media
    depends_on:
      - db
      - openwa
```

**¿Por qué tantos volúmenes?**

Un "volumen" en Docker es como una USB que se comparte entre contenedores. `openwa_data` guarda los datos de OpenWA (incluyendo la clave API). El backend monta ese volumen como **solo lectura** (`:ro`) para leer la clave API pero no modificarla.

### 3.3 Configuración de Django (`config/settings.py`)

Aquí se configura TODO el funcionamiento del backend. Vamos a ver las partes más importantes:

**Apps instaladas:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'rest_framework',          # Django REST Framework
    'corsheaders',             # Para permitir peticiones desde el frontend
    'accounts',                # Nuestra app de autenticación
    'core',                    # Catálogos
    'persons',                 # Personas
    'calls',                   # Llamadas
    'baptisms',                # Bautizos
    'dashboard',               # Reportes
    'notifications',           # WhatsApp
]
```

**Modelo de usuario personalizado:**
```python
AUTH_USER_MODEL = 'accounts.User'
```
Esto le dice a Django: "no uses el modelo User por defecto, usa el nuestro que está en accounts".

**Autenticación JWT (JSON Web Tokens):**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),    # Token de acceso: 1 día
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # Token de refresco: 7 días
}
```
Cuando un usuario inicia sesión, recibe 2 tokens. El **access token** es como una llave que dura 1 día. El **refresh token** sirve para pedir una llave nueva cuando expira.

**Configuración de OpenWA:**
```python
OPENWA_BASE_URL = os.environ.get('OPENWA_BASE_URL', 'http://openwa:2785/api')
OPENWA_API_KEY = os.environ.get('OPENWA_API_KEY', '')
OPENWA_SESSION_ID = os.environ.get('OPENWA_SESSION_ID', 'default')
OPENWA_COUNTRY_CODE = os.environ.get('OPENWA_COUNTRY_CODE', '57')
```
Cada variable lee primero de las variables de entorno (`.env`), y si no existe, usa un valor por defecto.

---

## 4. Base de datos: los modelos

### 4.1 Modelo User (`accounts/models.py`)

**¿Qué es un modelo?**
Un modelo es una clase de Python que representa una tabla en la base de datos. Cada atributo de la clase es una columna de la tabla.

```python
class User(AbstractUser):
    must_change_password = models.BooleanField(default=True)

    class Meta:
        db_table = 'AuthUser'
```

`AbstractUser` ya trae campos como `username`, `password`, `email`, `first_name`, `last_name`. Nosotros solo agregamos `must_change_password` (debe cambiar contraseña). Este campo se usa para que cuando un administrador crea un usuario, ese usuario tenga que cambiar la contraseña la primera vez que inicia sesión.

La línea `db_table = 'AuthUser'` le dice a Django: "guarda esta tabla con el nombre AuthUser en la base de datos".

### 4.2 RegisterUser (`accounts/models.py`)

```python
class RegisterUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='register_profile')
    names = models.CharField(max_length=100)        # Nombres
    last_name = models.CharField(max_length=100)     # Apellidos
    document = models.CharField(max_length=13, unique=True)  # Número de cédula (único)
    phone = models.CharField(max_length=10)          # Teléfono
    photo = models.ImageField(...)                   # Foto de perfil
    gender = models.CharField(max_length=10, choices=[('M', 'Masculino'), ('F', 'Femenino')])
    theme = models.CharField(max_length=10, choices=[('light', 'Claro'), ('dark', 'Oscuro')], default='light')
```

**OneToOneField** significa "una relación de uno a uno". Cada `User` tiene exactamente un `RegisterUser`, y cada `RegisterUser` pertenece a exactamente un `User`.

**¿Por qué separar User y RegisterUser?**
- `User` solo tiene datos de inicio de sesión (username, password)
- `RegisterUser` tiene datos personales (nombres, cédula, teléfono, foto)

**El campo `related_name='register_profile'`**: permite acceder desde User a RegisterUser así: `user.register_profile`

### 4.3 Adviser (`accounts/models.py`)

```python
class Adviser(models.Model):
    profile = models.OneToOneField(RegisterUser, on_delete=models.CASCADE, related_name='adviser_profile')
    roles = models.ManyToManyField(Role, related_name='advisers', blank=True)
    specialism = models.ForeignKey(Specialism, on_delete=models.SET_NULL, null=True, blank=True)
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    assigned_count = models.IntegerField(default=0)
```

**ManyToManyField**: un asesor puede tener VARIOS roles (ej: ser Padre Espiritual y Maestro al mismo tiempo). Y un rol puede tener VARIOS asesores.

La relación completa de modelos es:
```
User (login) → RegisterUser (datos) → Adviser (roles, especialidad)
```

Para navegar esta cadena y obtener el asesor desde el usuario que hizo la request:
```python
user.request.user.register_profile.adviser_profile
```
Esto es: "toma el usuario autenticado → ve a su perfil registrado → ve a su perfil de asesor".

**Métodos del Adviser:**

```python
def has_role(self, name):
    return self.roles.filter(name=name).exists()

def is_admin(self):
    return self.has_role('Administrador')
```

Estos métodos nos permiten preguntarle al asesor: "¿tienes el rol X?".

### 4.4 Person (`persons/models.py`)

```python
class Person(models.Model):
    names = models.CharField(max_length=100)               # Nombre
    lastname = models.CharField(max_length=100)            # Apellido
    document = models.CharField(max_length=13, unique=True) # Cédula
    phone = models.CharField(max_length=10)                # Teléfono
    # ... más campos ...
    spiritual_father = models.ForeignKey(                   # ¿Quién es su asesor?
        Adviser, on_delete=models.SET_NULL, null=True, related_name='spiritual_children'
    )
    assignment_state = models.CharField(max_length=20, choices=[
        ('pending', 'Pendiente'),          # No tiene asesor aún
        ('assigned', 'Asignado'),          # Tiene un asesor asignado
        ('completed', 'Completado'),       # Completaron las 3 llamadas
        ('deactivated', 'Desactivado'),    # Fue marcado como no efectivo
    ])
    member_state = models.CharField(max_length=20, choices=[
        ('effective', 'Efectivo'),          # Completaron el proceso exitosamente
        ('not_effective', 'No Efectivo'),   # No se pudo contactar/decidió no seguir
    ])
```

**assignment_state vs member_state:** son dos estados diferentes:

- `assignment_state`: ¿en qué etapa del proceso está? (pendiente → asignado → completado/desactivado)
- `member_state`: ¿fue efectivo o no? (efectivo = completó las 3 llamadas exitosamente)

**El campo `spiritual_father`**: es una clave foránea (ForeignKey) que apunta al Adviser que es su asesor. `related_name='spiritual_children'` permite acceder desde un Adviser a TODAS sus personas así: `adviser.spiritual_children.all()`

### 4.5 Call y CallDetail (`calls/models.py`)

```python
class Call(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='calls')
    call_number = models.IntegerField()  # 1, 2 o 3
    created_in = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['person', 'call_number']
        # Una persona no puede tener 2 llamadas #1
```

`unique_together` significa: no puede haber dos registros con la misma persona Y el mismo número de llamada. Así evitamos duplicados.

```python
class CallDetail(models.Model):
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='details')
    made_by = models.ForeignKey(Adviser, on_delete=models.CASCADE)  # ¿Quién hizo la llamada?
    scheduled_date = models.DateTimeField()     # ¿Cuándo debería hacerse?
    date_made = models.DateTimeField(null=True) # ¿Cuándo se hizo realmente?
    made = models.BooleanField(default=False)   # ¿Ya se hizo?
    state = models.CharField(max_length=20, choices=[
        ('effective', 'Efectiva'),              # Contestó y está bien
        ('not_effective', 'No Efectiva'),       # No contestó / no quiere seguir
    ], null=True)
    annotation = models.TextField(blank=True)    # Notas del asesor
    signature = models.ImageField(...)           # Firma digital
```

Cada `Call` (llamada #1, #2 o #3) tiene un `CallDetail` que guarda los detalles de CUÁNDO se programó, QUIÉN la hizo, CÓMO salió y qué NOTAS se tomaron.

---

## 5. Autenticación (Auth)

### 5.1 ¿Cómo funciona el login? (`accounts/views.py`)

Cuando el usuario hace POST a `/api/auth/login/` con username y contraseña:

```python
class AuthViewSet(ViewSet):
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # 1. Valida username y password
        user = serializer.validated_data['user']
        # 2. Obtiene el perfil del asesor
        adviser = user.register_profile.adviser_profile
        
        # 3. Obtiene los roles del asesor (ej: "Administrador, Padre Espiritual")
        roles = adviser.roles.all()
        role_names = ','.join(role.name for role in roles)
        
        # 4. Genera los tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # 5. Retorna todo al frontend
        return Response({
            'refresh': str(refresh),
            'access': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': role_names,
                'adviser_id': adviser.id,
                'names': adviser.profile.names,
                'theme': adviser.profile.theme,
                'photo': ...,
                'must_change_password': user.must_change_password,
            }
        })
```

**Paso a paso:**

1. **LoginSerializer** verifica que el username y contraseña sean correctos
2. `user.register_profile.adviser_profile` recorre la cadena User → RegisterUser → Adviser
3. `adviser.roles.all()` obtiene todos los roles del asesor (puede tener varios)
4. `','.join(...)` convierte los roles a un string separado por comas, ej: `"Administrador, Padre Espiritual"`
5. `RefreshToken.for_user(user)` crea los tokens JWT (access token + refresh token)
6. Retorna al frontend los tokens y datos del usuario

### 5.2 ¿Cómo se protegen las rutas?

Cada endpoint usa **permisos** que revisan si el usuario tiene el rol adecuado. Esto se hace en el archivo `accounts/permissions.py`:

```python
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        adviser = request.user.register_profile.adviser_profile
        return adviser.is_admin()
```

Esto lo usamos en las vistas así:
```python
class AdviserViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    # Solo los administradores pueden acceder aquí
```

---

## 6. Permisos: quién puede hacer qué

### 6.1 El enrutador por roles (`config/router.py`)

Cuando un usuario entra a la raíz de la API (`/api/`), no todos ven los mismos endpoints. Un **Padre Espiritual** no necesita ver el endpoint de asesores. Esto se logra con `RoleBasedRouter`:

```python
class RoleBasedRouter(DefaultRouter):
    def get_api_root_view(self, ...):
        # Mira los roles del usuario
        allowed = set()
        
        # Si es administrador → ve todo
        if adviser.is_admin():
            allowed.update(all_endpoints)
        
        # Si es Padre Espiritual → ve personas, llamadas, perfil
        if adviser.is_spiritual_father():
            allowed.update(person_endpoints)
            allowed.update(call_endpoints)
            allowed.update(profile_endpoints)
        
        # Si es Maestro → ve bautizos, perfil
        if adviser.is_teacher():
            allowed.update(baptism_endpoints)
            allowed.update(profile_endpoints)
        
        # Retorna solo los endpoints permitidos
        return Response({k: v for k, v in all_routes.items() if k in allowed})
```

### 6.2 Filtrado por rol en las vistas

Además de ocultar endpoints, cada vista **filtra los datos** según el rol. Por ejemplo, en `PersonViewSet`:

```python
def get_queryset(self):
    adviser = self.request.user.register_profile.adviser_profile
    
    if adviser.is_admin():
        return Person.objects.all()  # Admin ve TODAS las personas
    
    # Padre Espiritual o Maestro: solo ven SUS personas asignadas
    return Person.objects.filter(spiritual_father=adviser)
```

**Explicación:** cuando un Padre Espiritual entra a la lista de personas, el código `filter(spiritual_father=adviser)` se asegura de que solo vea las personas que él mismo tiene asignadas.

Lo mismo pasa con las llamadas:

```python
def get_queryset(self):
    if adviser.is_spiritual_father():
        # Padre Espiritual: solo ve los detalles que él mismo registró
        return CallDetail.objects.filter(made_by=adviser)
```

---

## 7. Registro de personas

### 7.1 El modelo Person (`persons/models.py`)

Una persona en la iglesia tiene:

- **Datos personales**: nombre, cédula, teléfono, dirección, género
- **Datos de iglesia**: especialidad (joven, normal, otra iglesia), servicio al que asiste
- **Estado de asignación**: `pending` (sin asesor), `assigned` (con asesor), `completed` (completado), `deactivated` (desactivado)
- **Estado de miembro**: `effective` (efectivo), `not_effective` (no efectivo)
- **Asignaciones**: quién es su padre espiritual, quién lo registró
- **Progreso**: inscrito a fundamentos (enrollment_fund_1), bautizado (baptized)

### 7.2 Creación de persona (`persons/serializers.py`)

Cuando el administrador crea una persona, el serializador `PersonCreateSerializer` hace varias cosas automáticamente:

```python
class PersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'
        read_only_fields = ['registered_by', 'spiritual_father', ...]

    def create(self, validated_data):
        # 1. El usuario autenticado es el que registra
        user = self.context['request'].user
        adviser = user.register_profile.adviser_profile
        validated_data['registered_by'] = adviser
        
        # 2. Crea la persona en la base de datos
        person = Person.objects.create(**validated_data)
        
        # 3. Asigna automáticamente un padre espiritual
        self.assign_spiritual_father(person)
        
        # 4. Crea la primera llamada automáticamente
        self.create_first_call(person)
        
        return person
```

#### ¿Cómo funciona la auto-asignación?

```python
def assign_spiritual_father(self, person):
    # Mapea la especialidad de la persona al nombre en la BD
    # Ej: "joven" → "Joven", "normal" → "Normal"
    specialism_name = SPECIALISM_MAP.get(person.specialism, 'Normal')
    
    # Busca un Padre Espiritual activo que:
    candidates = Adviser.objects.filter(
        roles__name='Padre Espiritual',  # Que tenga el rol
        is_active=True,                   # Que esté activo
        assigned_count__lt=3,             # Que tenga menos de 3 personas
        profile__gender=person.gender,    # Del mismo género que la persona
        specialism__name=specialism_name, # Con la misma especialidad
    )
    
    if candidates.exists():
        father = candidates.first()
        person.spiritual_father = father   # Asigna el padre
        person.assignment_state = 'assigned'
        father.assigned_count += 1         # Aumenta su contador
        father.save()
    else:
        # Si no hay asesor disponible, queda pendiente
        person.assignment_state = 'pending'
    
    person.save()
```

**Filtros de búsqueda (línea por línea):**

1. `roles__name='Padre Espiritual'`: el `__` (doble guión bajo) significa "campo relacionado". Busca advisers cuyo rol tenga nombre "Padre Espiritual"
2. `is_active=True`: solo asesores activos
3. `assigned_count__lt=3`: `__lt` = "less than" (menor que). Busca asesores con menos de 3 personas asignadas (capacidad máxima)
4. `profile__gender=person.gender`: `profile__` es el OneToOneField. Busca asesores del mismo género que la persona
5. `specialism__name=specialism_name`: busca asesores con la misma especialidad

**¿Qué pasa si no hay asesor disponible?** La persona queda con `assignment_state='pending'` y el administrador puede asignarle uno manualmente después.

#### ¿Cómo se crea la primera llamada?

```python
def create_first_call(self, person):
    father = person.spiritual_father
    
    if father:
        # Crea la llamada #1
        call = Call.objects.create(person=person, call_number=1)
        
        # Crea el detalle: ¿cuándo debe hacerse?
        # En desarrollo: 4 minutos después (para pruebas rápidas)
        # En producción: 48 horas después
        detail = CallDetail.objects.create(
            call=call,
            made_by=father,
            scheduled_date=timezone.now() + timedelta(minutes=4),
        )
        
        # Envía WhatsApp al padre
        result = OpenWAService().notify_assignment(father, person, detail)
```

### 7.3 Vista de personas (`persons/views.py`)

**Lista de personas:**
```python
class PersonViewSet(ModelViewSet):
    def get_queryset(self):
        # Filtra según el rol del usuario
        adviser = self.request.user.register_profile.adviser_profile
        if adviser.is_admin():
            return Person.objects.all()
        return Person.objects.filter(spiritual_father=adviser)
```

**Stats (estadísticas):**
```python
@action(detail=False, methods=['get'])
def stats(self, request):
    return Response({
        'total': Person.objects.count(),
        'assigned': Person.objects.filter(assignment_state='assigned').count(),
        'pending': Person.objects.filter(assignment_state='pending').count(),
        'completed': Person.objects.filter(assignment_state='completed').count(),
        'baptized': Person.objects.filter(baptized=True).count(),
        ...
    })
```

Cada línea cuenta cuántas personas hay en cada estado. Esto se muestra en tarjetas de colores en el frontend.

### 7.4 Asignación manual de padre espiritual

Cuando el administrador asigna un padre espiritual manualmente:

```python
@action(detail=True, methods=['post'])
def assign_spiritual_father(self, request, pk=None):
    person = self.get_object()
    adviser_id = request.data.get('adviser_id')
    override = request.data.get('override', False)
    
    new_father = Adviser.objects.get(id=adviser_id)
    
    # Validaciones
    errors = []
    
    # ¿El asesor ya tiene 3 personas?
    if new_father.assigned_count >= 3 and not override:
        errors.append('El asesor ya tiene 3 asignados')
    
    # ¿Son del mismo género?
    if new_father.profile.gender != person.gender:
        errors.append('El género no coincide')
    
    if errors:
        return Response({'warnings': errors, 'requires_override': True}, status=409)
    
    # Si había un padre anterior, se lo quitamos
    old_father = person.spiritual_father
    if old_father:
        old_father.assigned_count -= 1
        old_father.save()
    
    # Asignamos el nuevo
    person.spiritual_father = new_father
    person.assignment_state = 'assigned'
    new_father.assigned_count += 1
    new_father.save()
    person.save()
    
    return Response({'status': 'ok'})
```

El código `status=409` retorna un error "Conflict" (conflicto) con advertencias. El frontend puede mostrar esas advertencias y preguntar al admin si quiere forzar la asignación (con `override: true`).

---

## 8. Llamadas de seguimiento

### 8.1 ¿Cómo se estructura una llamada?

Cada persona tiene hasta 3 llamadas. La estructura es:

```
Persona (Juan Pérez)
├── Call #1 ── CallDetail (programada para el lunes, hecha el martes, efectiva)
├── Call #2 ── CallDetail (programada para el miércoles, hecha el jueves, no efectiva)
└── Call #3 ── CallDetail (programada para el viernes)
```

Cada `Call` es como un "número de llamada" (1, 2, 3). Cada `CallDetail` tiene los detalles reales (fecha, estado, notas, firma).

### 8.2 Registrar una llamada (`calls/views.py:94-185`)

Cuando el asesor hace clic en "registrar llamada", se ejecuta `record_call`:

```python
@action(detail=True, methods=['post'])
def record_call(self, request, pk=None):
    # 1. Obtiene la llamada que vamos a registrar
    call = self.get_object()
    
    # 2. Busca el detalle pendiente (el que tiene made=False)
    detail = call.details.filter(made=False).first()
    
    # 3. Guarda los datos enviados (state, annotation)
    serializer = CallDetailSerializer(detail, data=request.data, partial=True)
    serializer.save(made=True, date_made=timezone.now())
    
    # 4. Si no enviaron firma, copia la firma del asesor
    if 'signature' not in request.data and adviser.signature:
        detail.signature.save('signature.png', ContentFile(adviser.signature.read()))
    
    person = call.person
    state = serializer.validated_data.get('state', detail.state)
    
    # 5. ¿Fue efectiva? → crear siguiente llamada
    #    ¿Fue no efectiva? → NO crear (el proceso se detiene)
    if state == 'effective' and call.call_number < 3:
        next_number = call.call_number + 1
        next_call = Call.objects.create(person=person, call_number=next_number)
        CallDetail.objects.create(
            call=next_call,
            made_by=detail.made_by,
            scheduled_date=timezone.now() + delay
        )
    
    # 6. Enviar notificación WhatsApp
    if call.call_number in (1, 2):
        result = OpenWAService().notify_call_recorded(adviser, person, call.call_number, next_delay)
    
    # 7. Llamada #3: determina el estado FINAL de la persona
    if call.call_number == 3:
        if state == 'effective':
            # ¡Completaron! La persona es efectiva
            person.member_state = 'effective'
            person.spiritual_father.assigned_count -= 1
            person.spiritual_father.save()
            person.save()
        else:
            # No se pudo completar: persona no efectiva
            person.member_state = 'not_effective'
            person.assignment_state = 'deactivated'
            person.is_active = False
            person.spiritual_father.assigned_count -= 1
            person.spiritual_father = None
            person.save()
```

**Línea por línea:**

1. `call.details.filter(made=False).first()`: busca el detalle que aún no se ha hecho. Solo debe haber uno
2. `serializer.save(made=True, date_made=timezone.now())`: marca la llamada como "hecha ahora"
3. **Paso 5**: solo crea la siguiente llamada si fue efectiva. Si fue no efectiva, el proceso se detiene
4. **Paso 7**: la llamada #3 es la definitiva:
   - Si es efectiva: `member_state = 'effective'` (completaron las 3)
   - Si no es efectiva: `member_state = 'not_effective'`, se desactiva la persona, se libera el cupo del asesor

### 8.3 Editar una llamada (`calls/views.py:356-406`)

Cuando se edita un detalle de llamada, el backend detecta cambios de estado:

```python
def perform_update(self, serializer):
    old_state = serializer.instance.state   # Estado ANTES de editar
    detail = serializer.save()
    new_state = detail.state                 # Estado DESPUÉS de editar
    
    # CASO 1: Cambió de no efectiva → efectiva
    if old_state == 'not_effective' and new_state == 'effective':
        call = detail.call
        person = call.person
        adviser = detail.made_by
        
        if call_number < 3:
            # Si era no efectiva, no se había creado la siguiente.
            # Ahora que es efectiva, la creamos
            if not existe_siguiente_llamada():
                crear_siguiente_llamada()
                # Envía WhatsApp con el tiempo para la siguiente llamada
                OpenWAService().notify_call_recorded(adviser, person, call_number, delay)
        elif call_number == 3:
            # Llamada #3: ahora es efectiva → persona efectiva
            person.member_state = 'effective'
            person.is_active = True
            person.assignment_state = 'completed'
            person.spiritual_father.assigned_count -= 1
            person.spiritual_father.save()
            person.save()
            # Envía WhatsApp: "Felicidades, completaste las 3 llamadas"
            OpenWAService().notify_third_call_completed(adviser, person)
    
    # CASO 2: Cambió de efectiva → no efectiva
    elif old_state == 'effective' and new_state == 'not_effective':
        call = detail.call
        person = call.person
        adviser = detail.made_by
        
        if call_number < 3:
            # Era efectiva, se creó siguiente llamada.
            # Ahora es no efectiva: hay que borrar esa siguiente
            eliminar_siguiente_llamada_si_existe()
        elif call_number == 3:
            # Llamada #3: ahora es no efectiva → persona no efectiva
            person.member_state = 'not_effective'
            person.is_active = False
            person.assignment_state = 'deactivated'
            person.spiritual_father.assigned_count += 1  # Restauramos el contador
            person.spiritual_father.save()
            person.spiritual_father = None
            person.save()
            # Envía WhatsApp: "Gracias por comunicarte con {persona}"
            OpenWAService().notify_call_recorded(adviser, person, call_number, None)
```

**¿Por qué restaurar `assigned_count`?**
Cuando la llamada #3 se marcó como efectiva, el contador del asesor se decrementó (porque la persona "completó" el proceso). Si ahora editamos a no efectiva, la persona NO completó el proceso, entonces el asesor "recupera" ese cupo.

### 8.4 Crear llamada manualmente (admin) (`calls/views.py:37-82`)

El administrador puede crear llamadas manualmente para reiniciar el seguimiento de una persona no efectiva:

```python
def create(self, request, *args, **kwargs):
    serializer = CallCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    person = serializer.validated_data['person']
    call_number = serializer.validated_data['call_number']
    made_by = serializer.validated_data['made_by']
    
    # ¿Es un reinicio de seguimiento?
    # (persona no efectiva e inactiva)
    if person.member_state == 'not_effective' and not person.is_active:
        # Borra SOLO las llamadas desde este número en adelante
        # Ej: si crea call #2, borra #2 y #3 (conserva #1)
        #     si crea call #3, borra solo #3 (conserva #1 y #2)
        person.calls.filter(call_number__gte=call_number).delete()
        person.is_active = True            # Reactiva la persona
        person.assignment_state = 'assigned'
        person.save()
    
    call = Call.objects.create(
        person=person,
        call_number=call_number,
    )
    detail = CallDetail.objects.create(
        call=call,
        made_by=made_by,
        scheduled_date=timezone.now(),  # Siempre usa la hora actual
    )
    
    # Notifica al asesor vía WhatsApp (sin mensaje de "primera llamada")
    OpenWAService().notify_call_recorded(made_by, person, call_number, None)
```

**¿Qué hace `person.calls.filter(call_number__gte=call_number).delete()`?**
Borra solo las llamadas desde el número asignado hacia adelante. Por ejemplo, si el admin crea una llamada #2, borra las calls #2 y #3 (y sus detalles) pero conserva la #1. Si crea una #3, borra solo la #3. Así no se pierde el historial de llamadas anteriores exitosas.

**¿Por qué `scheduled_date=timezone.now()`?**
El administrador programa la llamada para AHORA MISMO. El asesor la verá como pendiente de inmediato. Se ignora la fecha que envió el frontend.

### 8.5 Semáforo de llamadas pendientes

Las llamadas pendientes tienen un color según el tiempo restante:

```python
total = scheduled_date - created_in         # Tiempo total disponible
remaining = scheduled_date - now            # Tiempo que falta
pct = remaining / total                     # Porcentaje de tiempo restante

if pct > 0.5:      color = 'green'     # Más del 50%: hay tiempo de sobra
elif pct > 0.25:   color = 'yellow'    # Entre 25% y 50%: hay que darse prisa
elif pct > 0.0:    color = 'orange'    # Menos del 25%: casi vencido
else:              color = 'red'       # Vencido
```

---

## 9. Bautizos

### 9.1 Modelos (`baptisms/models.py`)

- **Mode**: tipos de bautizo (ej: "Inmersión total", "Aspersión")
- **Calendar**: fechas de bautizo programadas
- **Class**: clases de fundamentos bíblicos
- **Attendant**: personas que asisten a las clases
- **BaptismalRegister**: el registro oficial de bautizo, relaciona:
  - La persona bautizada
  - El maestro que lo preparó
  - El acudiente (quien lo presenta)
  - El modo, clase y calendario

### 9.2 Vista de bautizos (`baptisms/views.py`)

Los maestros solo ven sus propios registros de bautizo:
```python
class BaptismalRegisterViewSet(ModelViewSet):
    def get_queryset(self):
        if adviser.is_admin():
            return BaptismalRegister.objects.all()
        return BaptismalRegister.objects.filter(teacher=adviser)
```

---

## 10. Dashboard y reportes

### 10.1 Dashboard del administrador (`dashboard/services.py`)

```python
def get_dashboard_data(start_date, end_date, period='monthly'):
    # 1. Cuenta personas por estado
    summary = {
        'total_registered': Person.objects.count(),
        'new_people': Person.objects.filter(specialism__in=['joven', 'normal']).count(),
        'other_church': Person.objects.filter(specialism='other_church').count(),
        'effective': Person.objects.filter(member_state='effective').count(),
        'not_effective': Person.objects.filter(member_state='not_effective').count(),
        'baptized': Person.objects.filter(baptized=True).count(),
    }
    
    # 2. Agrupa por fechas para la gráfica de tendencias
    if period == 'monthly':
        trend = Person.objects.annotate(
            month=TruncMonth('register_date')
        ).values('month').annotate(count=Count('id')).order_by('month')
    
    return {'summary': summary, 'trend': list(trend)}
```

**Explicación de `annotate` y `TruncMonth`**:
- `TruncMonth('register_date')`: toma la fecha de registro y la "trunca" al mes. Por ejemplo, "15 de marzo 2024" → "1 de marzo 2024"
- `annotate(month=...)`: crea un campo virtual llamado "month" con esa fecha truncada
- `.values('month')`: agrupa por mes
- `.annotate(count=Count('id'))`: cuenta cuántas personas hay en cada grupo

Esto nos da datos como:
```
[{month: marzo, count: 5}, {month: abril, count: 8}, {month: mayo, count: 3}]
```

### 10.2 Estadísticas del asesor

```python
def get_adviser_stats(adviser):
    return {
        'total_assigned': Person.objects.filter(spiritual_father=adviser).count(),
        'pending_calls': CallDetail.objects.filter(
            call__person__spiritual_father=adviser, made=False
        ).count(),
        'effective_calls': CallDetail.objects.filter(
            call__person__spiritual_father=adviser, state='effective'
        ).count(),
    }
```

---

## 11. OpenWA: notificaciones WhatsApp

### 11.1 ¿Qué es OpenWA?

OpenWA es un programa que corre en un contenedor Docker aparte. Su trabajo es:
1. Conectarse a WhatsApp Web (usando Puppeteer, que es un Chrome invisible)
2. Exponer una API REST para enviar mensajes
3. Mostrar un código QR para escanear con el teléfono

### 11.2 ¿Cómo se configura?

**Paso 1:** En `docker-compose.yml`, agregamos el servicio:
```yaml
openwa:
  image: ghcr.io/rmyndharis/openwa:latest
  ports:
    - "2785:2785"
  environment:
    API_MASTER_KEY: dev-admin-key
    ENGINE_TYPE: whatsapp-web.js
  volumes:
    - openwa_data:/app/data
```

**Paso 2:** El backend monta el mismo volumen para leer la clave API:
```yaml
backend:
  volumes:
    - openwa_data:/openwa_data:ro
```

El `:ro` significa "read only" (solo lectura). El backend puede LEER la clave pero no MODIFICARLA.

**Paso 3:** El primer inicio:
1. OpenWA arranca y genera una clave API en `/openwa_data/.api-key`
2. El backend lee esa clave automáticamente
3. Vamos a `http://localhost:8000/openwa/qr/` y escaneamos el código QR con WhatsApp

### 11.3 OpenWAService (`notifications/services.py`)

Esta es la clase que usa toda la aplicación para enviar WhatsApp.

**Paso 1: Creación del servicio**

```python
class OpenWAService:
    def __init__(self):
        self.base_url = settings.OPENWA_BASE_URL    # http://openwa:2785/api
        self.session_name = settings.OPENWA_SESSION_ID  # 'default'
        self.session_id = None
        self._api_key = None
        self._init_headers()
```

Cuando creamos `OpenWAService()`, se guarda la dirección de OpenWA y prepara los headers (cabeceras HTTP) con la clave API.

**Paso 2: Obtener la clave API**

```python
def _init_headers(self):
    from notifications.openwa_db import get_api_key
    self._api_key = get_api_key() or settings.OPENWA_API_KEY
    self.headers = {
        'X-API-Key': self._api_key,
        'Content-Type': 'application/json',
    }
```

Primero intenta leer la clave del archivo `/openwa_data/.api-key` (el volumen compartido). Si no existe, usa la variable de entorno `OPENWA_API_KEY`.

**Paso 3: Encontrar la sesión de WhatsApp**

```python
def _resolve_session(self):
    # OpenWA puede tener varias sesiones. Buscamos la nuestra por nombre
    resp = self._request('GET', '/sessions')
    for s in resp.json():
        if s.get('name') == self.session_name:     # 'default'
            self.session_id = s['id']               # Guardamos el UUID
            return self.session_id
```

OpenWA organiza las conexiones en "sesiones". Cada sesión tiene un nombre y un ID único (UUID). Buscamos la sesión llamada "default" y guardamos su UUID.

**Paso 4: Verificar que la sesión esté lista**

```python
def session_status(self):
    sid = self._resolve_session()
    resp = self._request('GET', f'/sessions/{sid}')
    return resp.json().get('status')
    # Posibles estados:
    # - 'connected', 'ready':  ✅ Listo para enviar
    # - 'qr_ready':            ⏳ Esperando que escaneen el QR
    # - 'starting', 'loading': 🔄 Iniciando...
    # - 'disconnected':        ❌ Desconectado
```

**Paso 5: Formatear el número de teléfono**

```python
def _format_phone(self, phone: str) -> str:
    # Ejemplo: "3209990001" → "573209990001@c.us"
    country_code = settings.OPENWA_COUNTRY_CODE  # '57'
    phone = quitar_caracteres_no_numericos(phone)
    
    if not phone.startswith(country_code):
        phone = country_code + phone  # Agrega 57 al inicio
    
    return f'{phone}@c.us'  # Agrega @c.us para WhatsApp
```

WhatsApp necesita el número en formato internacional con `@c.us` al final.

**Paso 6: Enviar el mensaje**

```python
def send_text(self, phone: str, message: str) -> dict:
    # 1. Asegura que la sesión esté lista
    self.session_id = None  # Re-resuelve siempre (evita usar sesión obsoleta)
    
    if not self.ensure_ready():
        return {'success': False, 'error': 'Sesión no lista'}
    
    # 2. Convierte el teléfono a formato WhatsApp
    chat_id = self._format_phone(phone)
    
    # 3. Envía el mensaje
    payload = {'chatId': chat_id, 'text': message}
    resp = self._request('POST',
        f'/sessions/{self.session_id}/messages/send-text',
        json=payload)
    
    if resp and resp.status_code == 200:
        return {'success': True}
    
    return {'success': False, 'error': resp.text}
```

**¿Por qué `self.session_id = None`?**
Cuando OpenWA se reinicia, las sesiones pueden cambiar de ID. Al poner `session_id = None`, forzamos a `_resolve_session()` a buscar la sesión de nuevo en lugar de usar una ID vieja.

### 11.4 Métodos de notificación

Cada método construye un mensaje en español y llama a `send_text`.

**`notify_assignment(adviser, person, call_detail)`** — Se llama cuando se asigna una persona a un asesor:
```python
mensaje = f"Se te ha asignado a {persona}. Tienes {tiempo} para hacer la primera llamada."
send_text(adviser.profile.phone, mensaje)
```

**`notify_call_recorded(adviser, person, call_number, next_delay)`** — Se llama después de registrar una llamada:
```python
if next_delay and call_number < 3:
    mensaje = f"Gracias por comunicarte con {persona}. La siguiente llamada será dentro de {tiempo}."
else:
    mensaje = f"Gracias por comunicarte con {persona}. Revisa el panel para más información."
```

**`notify_third_call_completed(adviser, person)`** — Llamada #3 completada exitosamente:
```python
mensaje = f"Felicidades, has completado las 3 llamadas con {persona} exitosamente."
```

### 11.5 Página QR (`notifications/views.py`)

Para conectar WhatsApp, necesitamos escanear un código QR. La página en `http://localhost:8000/openwa/qr/` maneja esto automáticamente:

```
Paso 1: Entras a /openwa/qr/
Paso 2: El sistema verifica si hay sesión
Paso 3: Si no hay sesión → la crea
Paso 4: Si está iniciando → muestra "Iniciando..."
Paso 5: Si está esperando QR → muestra el QR en pantalla (se actualiza cada 5s)
Paso 6: Escaneas el QR con WhatsApp → "Ya conectado"
```

### 11.6 ¿Por qué pueden fallar las notificaciones?

Las causas más comunes:

1. **No has escaneado el QR**: la sesión no está conectada
2. **OpenWA no está corriendo**: el contenedor Docker puede estar caído
3. **La clave API no es correcta**: el archivo `.api-key` no se pudo leer
4. **El número de teléfono no es válido**: formato incorrecto
5. **WhatsApp Web se desconectó**: el teléfono perdió conexión a internet

Cuando falla, el backend lo registra en los logs y devuelve una advertencia al frontend:
```python
warnings.append(f'No se pudo enviar notificación WhatsApp: {result.get("error")}')
```

---

## 12. Flujo completo

### 12.1 Registro de una persona nueva

```
1. Admin abre el formulario de nueva persona
2. Llena datos: nombre, cédula, teléfono, especialidad, género
3. Hace clic en "Guardar"

─── Esto pasa en el backend ───

4. PersonCreateSerializer.create():
   a. Crea la Person en la BD
   b. assign_spiritual_father():
      - Busca Padre Espiritual: mismo género, misma especialidad, cupo disponible
      - ¿Encontró? → Asigna (assigned_count +1)
      - ¿No encontró? → Queda como "pendiente"
   c. create_first_call():
      - Crea Call #1 + CallDetail (scheduled = ahora + 4min)
      - Envía WhatsApp: "Se te ha asignado a Juan Pérez"
   
5. Retorna la persona creada al frontend

─── El asesor recibe ───

6. WhatsApp: "Se te ha asignado a Juan Pérez. Tienes 48h para la 1ra llamada"
7. Entra al panel, ve la llamada pendiente en el semáforo (verde)
```

### 12.2 Seguimiento de llamadas (caso exitoso)

```
─── Llamada #1 ───

1. Asesor llama a Juan Pérez
2. Juan contesta, está bien
3. Asesor registra: "Efectiva" + anotación
4. Backend:
   a. Marca Call #1 como hecha (made=True, date_made=now)
   b. Crea Call #2 (scheduled = ahora + 10min)
   c. WhatsApp: "Gracias. La siguiente llamada será en 10min"

─── Llamada #2 ───

5. Asesor llama otra vez
6. Juan no contesta
7. Asesor registra: "No Efectiva"
8. Backend:
   a. Marca Call #2 como hecha
   b. NO crea Call #3 (proceso detenido)
   c. WhatsApp: "Gracias por comunicarte"

─── Editar llamada #2 a efectiva ───

9. Asesor editó: cambió de "No Efectiva" a "Efectiva"
10. Backend:
    a. Detecta cambio: not_effective → effective
    b. Crea Call #3 (porque no existía)

─── Llamada #3 ───

11. Asesor llama, Juan contesta
12. Registra: "Efectiva"
13. Backend:
    a. Persona: member_state = "effective"
    b. Asesor: assigned_count -1 (liberó cupo)
    c. WhatsApp: "Felicidades, completaste las 3 llamadas"
```

### 12.3 Reinicio de seguimiento / nueva llamada (admin)

```
1. Admin selecciona persona no efectiva, número de llamada y asesor
2. POST /api/calls/ {person, call_number: 2, made_by: asesor}
3. Backend:
   a. ¿Persona inactiva?
      └── Borra solo calls desde ese número en adelante
          (call #2: borra #2 y #3, conserva #1)
          (call #3: borra solo #3, conserva #1 y #2)
   b. Reactiva persona (is_active=True)
   c. Crea Call + CallDetail (scheduled = ahora)
   d. WhatsApp: notify_call_recorded (mensaje genérico)
```

### 12.4 Editar llamada (cambios de estado)

**Efectiva → No Efectiva (call #3):**
```
1. Admin/Padre Espiritual edita llamada #3
2. Cambia de "Efectiva" a "No Efectiva"
3. Backend:
   a. Detecta cambio: effective → not_effective
   b. Persona: member_state = "not_effective"
   c. Persona: is_active = False
   d. Persona: assignment_state = "deactivated"
   e. Asesor: assigned_count +1 (restaura cupo)
   f. Asesor: spiritual_father = None (desasigna)
   g. WhatsApp: notify_call_recorded (mensaje genérico)
```

**No Efectiva → Efectiva (call #3):**
```
1. Admin/Padre Espiritual edita llamada #3
2. Cambia de "No Efectiva" a "Efectiva"
3. Backend:
   a. Detecta cambio: not_effective → effective
   b. Persona: member_state = "effective"
   c. Persona: is_active = True
   d. Persona: assignment_state = "completed"
   e. Asesor: assigned_count -1
   f. WhatsApp: notify_third_call_completed ("Felicidades...")
```

### 12.5 Inscripción a Fundamentos

```
1. Persona debe tener member_state = "effective"
2. Admin hace clic en "Inscribir a Fundamentos"
3. Selecciona un Maestro
4. Backend:
   a. enrollment_fund_1 = True
   b. Padre anterior: assigned_count -1
   c. Nuevo spiritual_father = Maestro
   d. WhatsApp al Maestro: "Se te ha asignado Juan Pérez"
```

### 12.6 Bautizo

```
1. Persona debe tener enrollment_fund_1 = True
2. Admin hace clic en "Marcar como Bautizado"
3. Backend:
   a. Crea BaptismalRegister
   b. baptized = True
   c. Limpia spiritual_father (ya completó el proceso)
```
