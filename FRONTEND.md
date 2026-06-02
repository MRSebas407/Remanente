# FRONTEND - Tutorial Completo

Bienvenido a la documentación del frontend. Aquí aprenderás cómo funciona la interfaz de usuario, cómo se comunica con el backend, y cómo está organizado todo el código.

## Índice

1. [Introducción](#1-introducción)
2. [Tecnologías y conceptos](#2-tecnologías-y-conceptos)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Auth: inicio de sesión](#4-auth-inicio-de-sesión)
5. [Layout: la estructura de la página](#5-layout-la-estructura-de-la-página)
6. [Persons: lista de personas](#6-persons-lista-de-personas)
7. [Crear una persona](#7-crear-una-persona)
8. [Calls: llamadas de seguimiento](#8-calls-llamadas-de-seguimiento)
9. [Registrar una llamada](#9-registrar-una-llamada)
10. [Editar una llamada](#10-editar-una-llamada)
11. [Crear llamada manual (admin)](#11-crear-llamada-manual-admin)
12. [Baptisms: bautizos](#12-baptisms-bautizos)
13. [Dashboard: panel de reportes](#13-dashboard-panel-de-reportes)
14. [Advisers: gestión de asesores](#14-advisers-gestión-de-asesores)
15. [Shared: componentes compartidos](#15-shared-componentes-compartidos)
16. [Flujo completo](#16-flujo-completo)

---

## 1. Introducción

### ¿Qué hace el frontend?

El frontend es la interfaz gráfica que ven los usuarios en el navegador. Está hecha con **Angular 19** y se comunica con el backend mediante **peticiones HTTP** a la API REST.

Los usuarios pueden:
- **Iniciar sesión** con usuario y contraseña
- **Ver personas** registradas (según su rol)
- **Registrar llamadas** de seguimiento
- **Ver el dashboard** con estadísticas y gráficas
- **Gestionar bautizos** (si son maestros)
- **Gestionar asesores** (si son administradores)

### ¿Cómo se conecta al backend?

El frontend hace peticiones HTTP a `http://localhost:8000/api/` (la API del backend). Por ejemplo:
- `GET /api/persons/` — obtener lista de personas
- `POST /api/auth/login/` — iniciar sesión
- `POST /api/calls/{id}/record_call/` — registrar una llamada

Cada petición lleva un **token JWT** en el header de Authorization para identificar al usuario.

---

## 2. Tecnologías y conceptos

### Angular 19

Angular es un framework para crear aplicaciones web. Sus conceptos principales son:

| Concepto | ¿Qué es? |
|---|---|
| **Componente** | Una parte de la pantalla (ej: login, lista de personas, modal) |
| **Servicio** | Una clase que hace peticiones al backend o comparte datos |
| **Modelo** | Una interfaz que define la estructura de los datos |
| **Señal (signal)** | Una variable reactiva: cuando cambia, la pantalla se actualiza sola |
| **Ruta (route)** | La URL que muestra un componente (ej: `/persons`) |

### Señales (Signals)

```typescript
// Así se declara una señal
nombre = signal('');               // String
personas = signal<Person[]>([]);   // Array de personas
estaCargando = signal(false);      // Booleano

// Para leer el valor:
console.log(nombre());  // Se llama como función

// Para cambiar el valor:
nombre.set('Juan');              // Reemplaza el valor
personas.update(lista => ...);   // Modifica el valor actual
```

Las señales son importantes porque cuando cambian, Angular automáticamente actualiza la pantalla. No necesitas "refrescar" manualmente.

### Peticiones HTTP

```typescript
// El servicio HttpClient hace las peticiones
this.http.get<Person[]>('/api/persons/').subscribe(data => {
  this.personas.set(data);  // Cuando llega la respuesta, actualiza la señal
});
```

Todos los métodos HTTP disponibles:
- `this.http.get()` — obtener datos
- `this.http.post()` — crear datos
- `this.http.put()` / `this.http.patch()` — actualizar datos
- `this.http.delete()` — eliminar datos

### Interceptor

Un interceptor es como un "filtro" por el que pasan todas las peticiones HTTP. El nuestro agrega automáticamente el token de autenticación:

```typescript
export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    // Clona la petición y agrega el header Authorization
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  
  // Si no hay token, envía la petición normal
  return next(req);
}
```

---

## 3. Estructura del proyecto

```
frontend/
├── angular.json             # Configuración de Angular
├── package.json             # Dependencias (Angular 19, Chart.js, etc.)
├── tsconfig.json            # Configuración de TypeScript
│
├── src/
│   ├── index.html           # Página principal (solo tiene <app-root>)
│   ├── main.ts              # Punto de entrada (inicia la app)
│   ├── styles.css           # Estilos CSS globales
│   │
│   └── app/
│       ├── app.component.ts      # Componente raíz (toda la app)
│       ├── app.config.ts         # Configuración de proveedores
│       ├── app.routes.ts         # Definición de rutas (URLs)
│       │
│       ├── auth/                 # Inicio de sesión
│       │   ├── auth.service.ts   # Login, logout, JWT, roles
│       │   ├── auth.guard.ts     # Protección de rutas
│       │   └── login.ts          # Página de login
│       │
│       ├── layout/               # Estructura principal
│       │   ├── layout.ts         # Sidebar + header + contenido
│       │   └── layout.service.ts # Estado del sidebar
│       │
│       ├── persons/              # Personas
│       │   ├── person.model.ts   # Interfaces de datos
│       │   ├── person.service.ts # Peticiones al backend
│       │   ├── person-list.ts    # Lista de personas
│       │   ├── person-create.ts  # Modal crear persona
│       │   ├── person-edit.ts    # Modal editar persona
│       │   └── person-detail.ts  # Modal detalle
│       │
│       ├── calls/                # Llamadas
│       │   ├── call.model.ts     # Interfaces
│       │   ├── call.service.ts   # Peticiones
│       │   ├── call-list.ts      # Lista de llamadas
│       │   ├── call-detail.ts    # Modal registrar llamada
│       │   ├── call-detail-view.ts # Modal ver detalle
│       │   ├── call-form.ts      # Modal crear llamada
│       │   └── call-edit.ts      # Modal editar llamada
│       │
│       ├── baptisms/             # Bautizos
│       │   ├── baptism.model.ts  # Interfaces
│       │   ├── baptism.service.ts# Peticiones
│       │   └── baptism-list.ts   # Lista de bautizos
│       │
│       ├── dashboard/            # Dashboard
│       │   ├── dashboard.model.ts# Interfaces
│       │   ├── dashboard.service.ts # Peticiones
│       │   └── dashboard.ts      # Panel de reportes
│       │
│       ├── advisers/             # Asesores
│       │   ├── adviser.model.ts  # Interfaces
│       │   ├── adviser.service.ts# Peticiones
│       │   └── adviser-list.ts   # Lista de asesores
│       │
│       └── shared/               # Componentes compartidos
│           ├── toast.service.ts  # Notificaciones toast
│           ├── confirm.ts        # Modal de confirmación
│           ├── assign-father.ts  # Modal asignar padre
│           └── assign-maestro.ts # Modal asignar maestro
│
└── environments/
    └── environment.ts        # Configuración (URL del backend)
```

---

## 4. Auth: inicio de sesión

### 4.1 Rutas protegidas (`app.routes.ts`)

Las rutas definen qué URL muestra qué componente:

```typescript
export const routes: Routes = [
  // Ruta pública: cualquiera puede ver el login
  { path: 'login', component: Login },
  
  // Rutas protegidas: requieren autenticación
  { 
    path: '',                    // "http://localhost:4200/"
    component: Layout,           // Muestra el layout con sidebar
    canActivate: [authGuard],    // Solo si está autenticado
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'persons', component: PersonList },
      { path: 'calls', component: CallList },
      { path: 'baptisms', component: BaptismList },
      { path: 'advisers', component: AdviserList },
    ]
  },
];
```

**Explicación:**
- `/login` → muestra la pantalla de inicio de sesión (sin sidebar)
- `/dashboard` → muestra el dashboard (con sidebar)
- `/persons` → muestra la lista de personas
- etc.

`canActivate: [authGuard]` significa: "antes de mostrar esta ruta, ejecuta el authGuard". Si el usuario no está autenticado, lo redirige al login.

### 4.2 Guardia de autenticación (`auth.guard.ts`)

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // ¿El usuario inició sesión?
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  
  // ¿Debe cambiar la contraseña?
  if (auth.user()?.must_change_password) {
    router.navigate(['/profile']);
    return false;
  }
  
  return true;
};
```

**Paso a paso:**
1. `inject(AuthService)`: obtiene el servicio de autenticación
2. `auth.isLoggedIn()`: ¿hay un token guardado?
3. Si no hay token → redirige a `/login`
4. Si el usuario debe cambiar contraseña → redirige a `/profile`
5. Si todo está bien → permite entrar

### 4.3 Servicio de autenticación (`auth.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Señales (reactivas)
  user = signal<UserData | null>(null);   // Datos del usuario
  token = signal<string | null>(null);    // Token JWT

  constructor() {
    // Al iniciar, carga los datos guardados
    const saved = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    
    if (saved && savedToken) {
      this.user.set(JSON.parse(saved));
      this.token.set(savedToken);
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post('/api/auth/login/', { username, password }).pipe(
      tap((res: any) => {
        // Guarda tokens y datos del usuario
        localStorage.setItem('auth_token', res.access);
        localStorage.setItem('auth_refresh', res.refresh);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        
        this.token.set(res.access);
        this.user.set(res.user);
      })
    );
  }

  isAdmin(): boolean {
    return this.user()?.role?.includes('Administrador') ?? false;
  }

  isSpiritualFather(): boolean {
    return this.user()?.role?.includes('Padre Espiritual') ?? false;
  }

  isTeacher(): boolean {
    return this.user()?.role?.includes('Maestro') ?? false;
  }
}
```

**¿Por qué `providedIn: 'root'`?**
Significa que Angular crea una SOLA instancia de este servicio para toda la aplicación. Todos los componentes comparten la misma instancia.

**¿Cómo funciona el login?**

1. El usuario escribe username + password
2. `login()` hace POST a `/api/auth/login/`
3. El backend responde con tokens + datos del usuario
4. Guardamos todo en `localStorage` (persiste aunque cierren el navegador)
5. Actualizamos las señales `user` y `token`
6. El interceptor ahora agregará el token a todas las peticiones

**¿Por qué guardar en localStorage?**

Si solo guardamos en memoria (señales), al recargar la página se pierde todo. `localStorage` persiste los datos aunque el usuario cierre el navegador y vuelva a entrar.

### 4.4 Página de login (`login.ts`)

```typescript
@Component({
  template: `
    <div class="login-container">
      <form (ngSubmit)="onSubmit()">
        <input [(ngModel)]="username" placeholder="Usuario" required>
        <input [(ngModel)]="password" type="password" placeholder="Contraseña" required>
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  `
})
export class Login {
  username = '';
  password = '';
  
  onSubmit() {
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.error = 'Credenciales inválidas'
    });
  }
}
```

**Flujo:**
1. Usuario llena el formulario
2. Hace clic en "Iniciar Sesión"
3. `onSubmit()` llama a `auth.login()`
4. Si funciona → redirige al dashboard
5. Si falla → muestra "Credenciales inválidas"

---

## 5. Layout: la estructura de la página

### 5.1 Componente Layout (`layout.ts`)

El layout es la "cáscara" de la aplicación. Tiene tres partes:

```
┌──────────────────────────────────┐
│       HEADER (barra superior)    │
├──────┬───────────────────────────┤
│      │                           │
│ SIDE │    CONTENIDO PRINCIPAL    │
│ BAR  │    (<router-outlet>)      │
│      │                           │
└──────┴───────────────────────────┘
```

```typescript
@Component({
  template: `
    <div class="flex h-screen">
      <!-- Sidebar (menú lateral) -->
      <aside [class.collapsed]="collapsed()">
        <!-- Logo -->
        <img src="logo.png">
        
        <!-- Opciones de menú según el rol -->
        @if (auth.isAdmin() || auth.isSpiritualFather()) {
          <a routerLink="/persons">👥 Personas</a>
        }
        @if (auth.isAdmin() || auth.isSpiritualFather()) {
          <a routerLink="/calls">📞 Llamadas</a>
        }
        @if (auth.isAdmin() || auth.isTeacher()) {
          <a routerLink="/baptisms">✝️ Bautizos</a>
        }
        @if (auth.isAdmin()) {
          <a routerLink="/advisers">👤 Asesores</a>
        }
      </aside>
      
      <!-- Contenido principal -->
      <main>
        <!-- Header -->
        <header>
          <h1>{{ pageTitle }}</h1>
          <button (click)="toggleTheme()">🌓</button>
          <div class="user-menu">
            <img [src]="auth.user()?.photo">
            <span>{{ auth.user()?.names }}</span>
          </div>
        </header>
        
        <!-- Aquí se renderiza la página activa -->
        <router-outlet />
      </main>
    </div>
  `
})
export class Layout {
  collapsed = signal(false);
  
  constructor() {
    this.auth = inject(AuthService);
  }
}
```

**Explicación del menú por rol:**

- `@if (auth.isAdmin() || auth.isSpiritualFather())`: el enlace a "Personas" solo aparece si el usuario es Administrador O Padre Espiritual
- `@if (auth.isAdmin())`: "Asesores" solo para administradores

**¿Qué es `@if` y `@for`?**
Son las nuevas "control flow" de Angular 17+. Reemplazan `*ngIf` y `*ngFor`:

```typescript
// Angular 16 y antes:
<div *ngIf="mostrar">Hola</div>
<div *ngFor="let item of items">{{item}}</div>

// Angular 17+:
@if (mostrar) { <div>Hola</div> }
@for (item of items) { <div>{{item}}</div> }
```

---

## 6. Persons: lista de personas

### 6.1 Modelo de datos (`person.model.ts`)

```typescript
// Esto es lo que el backend nos devuelve cuando pedimos la lista de personas
export interface PersonListEntry {
  id: number;                    // ID en la base de datos
  names: string;                 // Nombres
  lastname: string;              // Apellidos
  document: string;              // Cédula
  phone: string;                 // Teléfono
  gender: string;                // 'M' o 'F'
  assignment_state: string;      // pending, assigned, completed, deactivated
  member_state: string;          // effective, not_effective
  specialism: string;            // joven, normal, other_church, distance
  spiritual_father: number|null; // ID del asesor (o null si no tiene)
  spiritual_father_name: string|null; // Nombre del asesor
  enrolled_fund_1: boolean;      // ¿Inscrito a fundamentos?
  baptized: boolean;             // ¿Bautizado?
  data_consent: boolean;         // ¿Dio consentimiento?
  is_active: boolean;            // ¿Activo en el sistema?
}
```

### 6.2 Servicio de personas (`person.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class PersonService {
  constructor(private http: HttpClient) {}
  
  // Obtener lista de personas
  list(params?: any): Observable<any> {
    return this.http.get('/api/persons/', { params });
    // Ejemplo: this.http.get('/api/persons/?name=juan&page=1')
  }
  
  // Obtener estadísticas
  getStats(): Observable<PersonStats> {
    return this.http.get<PersonStats>('/api/persons/stats/');
    // Retorna: { total: 50, assigned: 30, pending: 10, ... }
  }
  
  // Crear persona
  create(data: FormData): Observable<any> {
    return this.http.post('/api/persons/', data);
    // FormData porque puede incluir foto
  }
  
  // Asignar padre espiritual
  assignSpiritualFather(id: number, data: any): Observable<any> {
    return this.http.post(`/api/persons/${id}/assign_spiritual_father/`, data);
    // data = { adviser_id: 5, override: true }
  }
}
```

**Explicación:**

Cada método corresponde a un endpoint del backend:
- `list()` → `GET /api/persons/`
- `getStats()` → `GET /api/persons/stats/`
- `create()` → `POST /api/persons/`
- `assignSpiritualFather()` → `POST /api/persons/{id}/assign_spiritual_father/`

### 6.3 Componente de lista (`person-list.ts`)

Este es el componente más complejo. Veamos sus partes:

**Señales (estado del componente):**

```typescript
export class PersonList {
  // Datos
  persons = signal<PersonListEntry[]>([]);  // Lista de personas
  stats = signal<PersonStats | null>(null);  // Estadísticas
  
  // Filtros
  searchName = signal('');     // Filtro por nombre
  filterState = signal('');    // Filtro por estado
  
  // Paginación
  currentPage = signal(1);
  totalPages = signal(1);
  
  // Modales
  showCreateModal = signal(false);
  showDetailModal = signal(false);
}
```

**Cargar datos al iniciar:**

```typescript
ngOnInit() {
  this.loadPersons();
  this.loadStats();
}

loadPersons() {
  const params: any = {
    page: this.currentPage(),
    page_size: 20,
  };
  
  if (this.searchName()) params.name = this.searchName();
  if (this.filterState()) params.assignment_state = this.filterState();
  
  this.personService.list(params).subscribe(res => {
    this.persons.set(res.results);     // Guarda los resultados
    this.totalPages.set(Math.ceil(res.count / 20));  // Calcula páginas
  });
}
```

**Filtros:**

Cuando el usuario escribe en el campo de búsqueda, los filtros se actualizan:

```typescript
// En el HTML:
// <input (input)="searchName.set($any($event.target).value); loadPersons()">

// Cada vez que el usuario escribe:
// 1. searchName.set(valor) → actualiza la señal
// 2. loadPersons() → hace nueva petición al backend con el filtro
```

**Tarjetas de estadísticas:**

Las tarjetas muestran conteos y al hacer clic filtran la lista:

```typescript
// En el HTML:
// @for (stat of statsCards; track stat.key) {
//   <div class="card" (click)="filterByState(stat.key)">
//     <h3>{{ stat.label }}</h3>
//     <p>{{ stat.count }}</p>
//   </div>
// }

filterByState(state: string) {
  this.filterState.set(state);
  this.loadPersons();  // Recarga con el filtro
}
```

**Tabla de personas:**

```html
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Documento</th>
      <th>Asesor</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    @for (person of persons(); track person.id) {
      <tr>
        <td>{{ person.names }} {{ person.lastname }}</td>
        <td>{{ person.document }}</td>
        <td>{{ person.spiritual_father_name || '—' }}</td>
        <td>
          <!-- Muestra el estado con un color -->
          <span [class.text-green]="person.member_state === 'effective'">
            {{ person.member_state }}
          </span>
        </td>
        <td>
          <!-- Botones de acción según el estado -->
          @if (!person.spiritual_father && auth.isAdmin()) {
            <button (click)="openAssignFather(person)">Asignar Padre</button>
          }
          @if (person.member_state === 'effective' && !person.enrollment_fund_1) {
            <button (click)="openAssignMaestro(person)">Inscribir a Fund.</button>
          }
        </td>
      </tr>
    }
  </tbody>
</table>
```

---

## 7. Crear una persona

### 7.1 Modal de creación (`person-create.ts`)

Cuando el admin hace clic en "+ Nueva Persona", se abre un modal:

```typescript
@Component({
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2>Nueva Persona</h2>
        
        <form (ngSubmit)="onSubmit()">
          <!-- Datos personales -->
          <label>Nombres *</label>
          <input [(ngModel)]="form.names" name="names" required>
          
          <label>Apellidos *</label>
          <input [(ngModel)]="form.lastname" name="lastname" required>
          
          <label>Documento *</label>
          <input [(ngModel)]="form.document" name="document" required>
          
          <label>Teléfono *</label>
          <input [(ngModel)]="form.phone" name="phone" required>
          
          <!-- Especialidad -->
          <label>Especialidad *</label>
          <select [(ngModel)]="form.specialism" name="specialism">
            <option value="joven">Joven</option>
            <option value="normal">Normal</option>
            <option value="other_church">Otra Iglesia</option>
            <option value="distance">Distancia</option>
          </select>
          
          <!-- Si escogió "Otra Iglesia", mostrar campos extra -->
          @if (form.specialism === 'other_church') {
            <label>Iglesia de procedencia</label>
            <input [(ngModel)]="form.comes_from_church" name="comes_from_church">
          }
          
          <!-- Género -->
          <label>Género *</label>
          <select [(ngModel)]="form.gender" name="gender">
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
          
          <label>Consentimiento de datos *</label>
          <input type="checkbox" [(ngModel)]="form.data_consent" name="data_consent">
          
          <button type="submit">Guardar</button>
          <button type="button" (click)="close()">Cancelar</button>
        </form>
      </div>
    </div>
  `
})
export class PersonCreate {
  form: any = {};
  
  onSubmit() {
    const data = new FormData();
    // Agrega cada campo al FormData
    for (const key of Object.keys(this.form)) {
      data.append(key, this.form[key]);
    }
    
    this.personService.create(data).subscribe({
      next: (res) => {
        this.saved.emit(res);  // Avísale al padre que se guardó
        this.close();          // Cierra el modal
      },
      error: (err) => this.toast.error('Error al crear persona')
    });
  }
}
```

**¿Por qué FormData?**
Se usa `FormData` en lugar de JSON porque la creación puede incluir una foto (archivo binario). `FormData` permite enviar texto y archivos en la misma petición.

---

## 8. Calls: llamadas de seguimiento

### 8.1 Modelo de datos (`call.model.ts`)

```typescript
export interface CallEntry {
  detail_id: number;          // ID del detalle de la llamada
  call_id: number;            // ID de la llamada (Call)
  person_id: number;          // ID de la persona
  person_name: string;        // "Juan Pérez"
  call_number: number;        // 1, 2 o 3
  scheduled_date: string;     // Fecha programada (ISO string)
  created_in: string;         // Fecha de creación
  date_made: string | null;   // Fecha real (null si no se ha hecho)
  made: boolean;              // ¿Ya se hizo?
  state: string | null;       // "effective", "not_effective" o null
  annotation: string;         // Notas
  signature: string | null;   // URL de la firma
  made_by_id: number;         // ID del asesor que la hizo
  made_by_name: string;       // Nombre del asesor
  color: string;              // "green", "yellow", "orange", "red"
}
```

El campo `color` lo calcula el backend según el tiempo restante.

### 8.2 Servicio de llamadas (`call.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class CallService {
  constructor(private http: HttpClient) {}
  
  // Obtener todas las llamadas (con filtros)
  getAllCalls(params?: any): Observable<any> {
    return this.http.get('/api/calls/all_calls/', { params });
  }
  
  // Obtener llamadas pendientes (semáforo)
  getPendingCalls(): Observable<any> {
    return this.http.get('/api/calls/pending_calls/');
  }
  
  // Registrar una llamada como hecha
  recordCall(id: number, data: any): Observable<any> {
    return this.http.post(`/api/calls/${id}/record_call/`, data);
  }
  
  // Crear una llamada nueva (solo admin)
  createCall(data: any): Observable<any> {
    return this.http.post('/api/calls/', data);
  }
  
  // Actualizar un detalle de llamada
  updateCallDetail(id: number, data: any): Observable<any> {
    return this.http.patch(`/api/call-details/${id}/`, data);
  }
}
```

### 8.3 Lista de llamadas (`call-list.ts`)

```typescript
export class CallList {
  // Señales
  calls = signal<CallEntry[]>([]);
  pendingCalls = signal<CallEntry[]>([]);
  expiredCalls = signal<CallEntry[]>([]);
  
  // Filtros
  filterName = signal('');
  filterState = signal('');
  currentPage = signal(1);
  
  ngOnInit() {
    this.loadCalls();
    this.loadPending();
  }
  
  loadCalls() {
    const params: any = { page: this.currentPage(), page_size: 20 };
    if (this.filterName()) params.name = this.filterName();
    if (this.filterState()) params.state = this.filterState();
    
    this.callService.getAllCalls(params).subscribe(res => {
      this.calls.set(res.results);
    });
  }
  
  loadPending() {
    this.callService.getPendingCalls().subscribe(pending => {
      const now = Date.now();
      
      // Separa entre pendientes (futuras) y vencidas (pasadas)
      this.pendingCalls.set(
        pending.filter((c: any) => new Date(c.scheduled_date).getTime() >= now)
      );
      this.expiredCalls.set(
        pending.filter((c: any) => new Date(c.scheduled_date).getTime() < now)
      );
    });
  }
}
```

**El semáforo:**

```html
<!-- Llamadas vencidas (rojo) -->
@if (expiredCalls().length > 0) {
  <div class="bg-red-100 p-4 rounded-lg">
    <h3>🔴 Vencidas ({{ expiredCalls().length }})</h3>
    @for (call of expiredCalls(); track call.detail_id) {
      <div class="flex justify-between">
        <span>{{ call.person_name }} - Llamada #{{ call.call_number }}</span>
        <span>{{ remainingFromDate(call.scheduled_date) }}</span>
      </div>
    }
  </div>
}

<!-- Llamadas pendientes (con color) -->
<div class="grid grid-cols-3 gap-4">
  @for (call of pendingCalls(); track call.detail_id) {
    <div [class]="'border-l-4 border-' + call.color + '-500 p-4'">
      <span>{{ call.person_name }}</span>
      <span>Llamada #{{ call.call_number }}</span>
      <span>{{ remainingFromDate(call.scheduled_date) }}</span>
    </div>
  }
</div>
```

---

## 9. Registrar una llamada

### 9.1 Modal de registro (`call-detail.ts`)

Cuando el asesor hace clic en ✅ para registrar una llamada:

```typescript
@Component({
  template: `
    <div class="modal">
      <h2>Registrar Llamada #{{ call().call_number }}</h2>
      <p>Persona: {{ call().person_name }}</p>
      
      <form (ngSubmit)="onSubmit()">
        <!-- Estado de la llamada -->
        <label>Resultado *</label>
        <select [(ngModel)]="state" name="state" required>
          <option value="effective">✅ Efectiva</option>
          <option value="not_effective">❌ No Efectiva</option>
        </select>
        
        <!-- Notas -->
        <label>Anotación</label>
        <textarea [(ngModel)]="annotation" name="annotation"></textarea>
        
        <!-- Firma digital -->
        <label>Firma</label>
        <canvas #signatureCanvas (mousedown)="startDrawing($event)"></canvas>
        <button type="button" (click)="clearSignature()">Limpiar</button>
        
        <button type="submit">Guardar</button>
      </form>
    </div>
  `
})
export class CallDetail {
  call = input.required<CallEntry>();  // Recibe la llamada a registrar
  state = 'effective';
  annotation = '';
  
  @ViewChild('signatureCanvas') canvas!: ElementRef;
  
  onSubmit() {
    const data = new FormData();
    data.append('state', this.state);
    data.append('annotation', this.annotation);
    
    // Si dibujó una firma, la convierte a imagen
    if (this.hasSignature) {
      const blob = dataURLToBlob(this.canvas.nativeElement.toDataURL());
      data.append('signature', blob, 'signature.png');
    }
    
    this.callService.recordCall(this.call().call_id, data).subscribe({
      next: (res) => {
        this.saved.emit(res);  // Avísale al padre
        this.close();
      },
      error: (err) => this.toast.error('Error al registrar llamada')
    });
  }
}
```

**¿Cómo funciona la firma digital?**

1. El usuario dibuja en un elemento `<canvas>` (lienzo) con el mouse
2. Al hacer clic en "Guardar", el canvas se convierte a imagen PNG
3. Esa imagen se envía al backend como parte del FormData
4. El backend la guarda en la carpeta `media/signatures/`
5. Si el usuario no dibuja firma, el backend copia automáticamente la firma del asesor

---

## 10. Editar una llamada

### 10.1 Modal de edición (`call-edit.ts`)

```typescript
@Component({
  template: `
    <div class="modal">
      <h2>Editar Llamada</h2>
      
      <form (ngSubmit)="onSubmit()">
        <label>Estado</label>
        <select [(ngModel)]="state" name="state">
          <option value="effective">✅ Efectiva</option>
          <option value="not_effective">❌ No Efectiva</option>
        </select>
        
        <label>Anotación</label>
        <textarea [(ngModel)]="annotation" name="annotation"></textarea>
        
        <button type="submit">Guardar Cambios</button>
      </form>
    </div>
  `
})
export class CallEdit {
  detail = input.required<any>();  // Recibe el detalle a editar
  state = signal('');
  annotation = signal('');
  
  ngOnInit() {
    // Carga los valores actuales
    this.state.set(this.detail().state);
    this.annotation.set(this.detail().annotation || '');
  }
  
  onSubmit() {
    const data: any = { state: this.state() };
    if (this.annotation()) data.annotation = this.annotation();
    
    this.callService.updateCallDetail(this.detail().detail_id, data).subscribe({
      next: () => {
        this.saved.emit();
        this.close();
      }
    });
  }
}
```

**¿Qué pasa en el backend cuando edito?**

El backend detecta el cambio de estado:

| Cambio | ¿Qué hace el backend? |
|---|---|
| `not_effective` → `effective` (call #1 o #2) | Crea la siguiente llamada si no existe |
| `not_effective` → `effective` (call #3) | Marca persona como efectiva, completa el proceso |
| `effective` → `not_effective` (call #1 o #2) | Elimina la siguiente llamada auto-creada |
| `effective` → `not_effective` (call #3) | Marca persona como no efectiva, desactiva, restaura contador |

---

## 11. Crear llamada manual (admin)

### 11.1 Modal de creación (`call-form.ts`)

```typescript
@Component({
  template: `
    <div class="modal">
      <h2>Nueva Llamada</h2>
      
      <form (ngSubmit)="onSubmit()">
        <!-- Solo personas NO efectivas -->
        <label>Persona</label>
        <select [(ngModel)]="selectedPerson" name="person">
          @for (p of availablePersons(); track p.id) {
            <option [value]="p.id">{{ p.names }} {{ p.lastname }}</option>
          }
        </select>
        
        <label>Llamada #</label>
        <select [(ngModel)]="callNumber" name="call_number">
          <option value="1">Primera</option>
          <option value="2">Segunda</option>
          <option value="3">Tercera</option>
        </select>
        
        <label>Asesor</label>
        <select [(ngModel)]="madeBy" name="made_by">
          @for (a of advisers(); track a.id) {
            <option [value]="a.id">{{ a.full_name }}</option>
          }
        </select>
        
        <button type="submit">Crear Llamada</button>
      </form>
    </div>
  `
})
export class CallForm {
  availablePersons = signal<PersonListEntry[]>([]);
  advisers = signal<AdviserListEntry[]>([]);
  selectedPerson = 0;
  callNumber = 1;
  madeBy = 0;
  
  ngOnInit() {
    // Carga personas no efectivas (para reiniciar seguimiento)
    this.personService.list({ member_state: 'not_effective' }).subscribe(res => {
      this.availablePersons.set(res.results);
    });
    
    // Carga asesores disponibles
    this.adviserService.list().subscribe(res => {
      this.advisers.set(res.results);
    });
  }
  
  onSubmit() {
    this.callService.createCall({
      person: this.selectedPerson,
      call_number: this.callNumber,
      made_by: this.madeBy,
      // scheduled_date: opcional, el backend usa timezone.now()
    }).subscribe({
      next: () => {
        this.saved.emit();
        this.close();
      }
    });
  }
}
```

**¿Por qué filtra personas con `member_state='not_effective'`?**

Porque el propósito de crear una llamada manual es **reiniciar el seguimiento** de personas que no fueron efectivas. El admin les da una segunda oportunidad.

---

## 12. Baptisms: bautizos

### 12.1 Estructura del componente (`baptism-list.ts`)

El componente de bautizos tiene **tabs** (pestañas) para organizar la información:

```
┌──────────────────────────────────────┐
│ [Acudientes] [Clases] [Calendarios]  │
│ [Modalidades] [Registros]            │
├──────────────────────────────────────┤
│                                      │
│   Contenido de la pestaña activa     │
│                                      │
└──────────────────────────────────────┘
```

Cada pestaña hace CRUD (Crear, Leer, Actualizar, Eliminar) de su modelo:

- **Acudientes**: personas que pueden presentar a otros para bautizo
- **Clases**: las clases de fundamentos bíblicos
- **Calendarios**: fechas disponibles para bautizo
- **Modalidades**: tipos de bautizo (inmersión, aspersión, etc.)
- **Registros**: los registros de bautizo ya realizados

### 12.2 Quick Register

El botón "Nuevo Registro" abre un modal para registrar un bautizo rápidamente:

```typescript
quickRegister(data: {
  person_id: number;       // Persona bautizada
  teacher_id: number;      // Maestro que la preparó
  attendant_id: number;    // Acudiente
  mode_id: number;         // Modo de bautizo
  class_id: number;        // Clase tomada
  calendar_id: number;     // Fecha del calendario
  baptism_date: string;    // Fecha del bautizo
}): Observable<any> {
  return this.http.post('/api/baptisms/quick_register/', data);
}
```

---

## 13. Dashboard: panel de reportes

### 13.1 Vista de administrador (`dashboard.ts`)

El dashboard del admin tiene:

```
┌──────────────────────────────────────────────────────┐
│ [📅 Semanal] [📅 Mensual] [📅 Anual]                 │
│                                                       │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│ │Total │ │Nuevos│ │Otra  │ │Efect.│ │No Efe│ │Baut│ │
│ │  50  │ │  20  │ │ Igle │ │  15  │ │   5  │ │ 10 │ │
│ │      │ │      │ │  10  │ │      │ │      │ │    │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └────┘ │
│                                                       │
│  📊 GRÁFICA DE BARRAS (Chart.js)                      │
│  │█│                                                  │
│  │█│█│                                                │
│  │█│█│█│                                              │
│  └─┴─┴─┴─▶                                            │
│   Ene Feb Mar                                          │
└──────────────────────────────────────────────────────┘
```

**¿Cómo se obtienen los datos?**

```typescript
ngOnInit() {
  this.loadReport('monthly');
}

loadReport(period: string) {
  this.dashboardService.getReport(period).subscribe(data => {
    this.summary.set(data.summary);   // Las tarjetas
    this.trend.set(data.trend);       // La gráfica
  });
}
```

**Las tarjetas:**

```html
<div class="grid grid-cols-6 gap-4">
  <!-- Cada tarjeta muestra un número y al hacer clic togglea -->
  <div class="card" (click)="toggleDataset('total')">
    <h3>Consolidados</h3>
    <p>{{ summary().total_registered }}</p>
  </div>
  
  <div class="card bg-green-50" (click)="toggleDataset('new')">
    <h3>Nuevos</h3>
    <p>{{ summary().new_people }}</p>
  </div>
  
  <div class="card bg-purple-50" (click)="toggleDataset('other')">
    <h3>Otra Iglesia</h3>
    <p>{{ summary().other_church }}</p>
  </div>
  
  <div class="card bg-blue-50" (click)="toggleDataset('effective')">
    <h3>Efectivos</h3>
    <p>{{ summary().effective }}</p>
  </div>
  
  <div class="card bg-red-50" (click)="toggleDataset('not_effective')">
    <h3>No Efectivos</h3>
    <p>{{ summary().not_effective }}</p>
  </div>
  
  <div class="card bg-amber-50" (click)="toggleDataset('baptized')">
    <h3>Bautizados</h3>
    <p>{{ summary().baptized }}</p>
  </div>
</div>
```

**La gráfica con Chart.js:**

```typescript
// Chart.js es una librería para hacer gráficas en el navegador
ngAfterViewInit() {
  this.chart = new Chart(this.canvas.nativeElement, {
    type: 'bar',
    data: {
      labels: ['Ene', 'Feb', 'Mar', ...],  // Meses
      datasets: [
        {
          label: 'Nuevos',
          data: [5, 8, 3, ...],             // Valores
          backgroundColor: 'green',
          hidden: false,                     // Se togglea al hacer clic
        },
        {
          label: 'Otra Iglesia',
          data: [2, 4, 1, ...],
          backgroundColor: 'purple',
          hidden: false,
        },
        // ... más datasets
      ]
    }
  });
}

toggleDataset(key: string) {
  // Busca el dataset por label y cambia su visibilidad
  const dataset = this.chart.data.datasets.find(d => d.label === key);
  if (dataset) {
    dataset.hidden = !dataset.hidden;  // Muestra/oculta
    this.chart.update();               // Redibuja la gráfica
  }
}
```

### 13.2 Vista de asesor

El asesor ve sus propias estadísticas:

```typescript
loadMyStats() {
  this.dashboardService.getMyStats().subscribe(stats => {
    this.myStats.set(stats);
  });
}
```

Esto muestra: cuántas personas tiene asignadas, llamadas pendientes, vencidas, realizadas, efectivas y no efectivas.

---

## 14. Advisers: gestión de asesores

### 14.1 Servicio (`adviser.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class AdviserService {
  constructor(private http: HttpClient) {}
  
  list(params?: any): Observable<any> {
    return this.http.get('/api/advisers/', { params });
  }
  
  create(data: FormData): Observable<any> {
    return this.http.post('/api/advisers/', data);
  }
  
  update(id: number, data: FormData): Observable<any> {
    return this.http.put(`/api/advisers/${id}/`, data);
  }
  
  deactivate(id: number): Observable<any> {
    return this.http.post(`/api/advisers/${id}/deactivate/`, {});
  }
  
  activate(id: number): Observable<any> {
    return this.http.post(`/api/advisers/${id}/activate/`, {});
  }
  
  resetPassword(id: number): Observable<any> {
    return this.http.post(`/api/advisers/${id}/reset_password/`, {});
  }
}
```

### 14.2 Componente de lista (`adviser-list.ts`)

Solo visible para administradores. Muestra:

1. **Tabla de asesores** con columnas: nombre, roles, documento, teléfono, activo/inactivo
2. **Filtros**: búsqueda por nombre, documento, teléfono, rol, estado
3. **Acciones por fila**:
   - ✏️ Editar: abre modal para cambiar datos
   - 🔄 Resetear contraseña: la restablece al número de documento
   - ✅/❌ Activar/Desactivar

**El modal de creación/edición incluye:**
- Datos de usuario: username, email, contraseña
- Datos personales: nombres, documento, teléfono, género, foto
- Datos de asesor: roles, especialidad, firma

---

## 15. Shared: componentes compartidos

Estos componentes se usan en varias partes de la aplicación.

### 15.1 Toast Service (`toast.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  
  success(message: string) {
    this.toasts.update(t => [...t, { message, type: 'success' }]);
    setTimeout(() => this.toasts.update(t => t.slice(1)), 3000);
    // Después de 3 segundos, el toast desaparece solo
  }
  
  error(message: string) {
    this.toasts.update(t => [...t, { message, type: 'error' }]);
    setTimeout(() => this.toasts.update(t => t.slice(1)), 5000);
  }
}
```

**¿Cómo se usa?**
```typescript
// En cualquier componente:
this.toast.success('Persona creada exitosamente');
this.toast.error('Error al guardar');
```

### 15.2 Assign Father (`assign-father.ts`)

Modal para asignar un padre espiritual a una persona:

```typescript
@Component({
  template: `
    <div class="modal">
      <h2>Asignar Padre Espiritual</h2>
      <p>Persona: {{ person().names }} {{ person().lastname }}</p>
      
      <select [(ngModel)]="selectedAdviser">
        @for (a of availableAdvisers(); track a.id) {
          <option [value]="a.id">
            {{ a.full_name }} ({{ a.assigned_count }}/3)
          </option>
        }
      </select>
      
      <!-- Advertencia si el asesor ya tiene 3 -->
      @if (showWarning()) {
        <p class="text-yellow">
          ⚠️ Este asesor ya tiene 3 asignados. ¿Forzar?
          <input type="checkbox" [(ngModel)]="override">
        </p>
      }
      
      <button (click)="assign()">Asignar</button>
    </div>
  `
})
export class AssignFather {
  person = input.required<PersonListEntry>();
  availableAdvisers = signal<AdviserListEntry[]>([]);
  selectedAdviser = 0;
  override = false;
  showWarning = signal(false);
  
  assign() {
    this.personService.assignSpiritualFather(this.person().id, {
      adviser_id: this.selectedAdviser,
      override: this.override,
    }).subscribe({
      next: () => this.saved.emit(),  // El padre muestra el toast
      error: (err) => {
        if (err.status === 409) {
          this.showWarning.set(true);  // Muestra advertencia
        }
      }
    });
  }
}
```

**Explicación del flujo:**

1. Se cargan los asesores disponibles (misma especialidad, mismo género)
2. El admin selecciona uno
3. Si el asesor ya tiene 3 personas: el backend responde con error 409
4. El frontend muestra la advertencia y un checkbox "Forzar"
5. Si el admin marca "Forzar" y vuelve a intentar: `override: true`
6. El backend acepta la asignación forzada

### 15.3 Assign Maestro (`assign-maestro.ts`)

Similar a Assign Father, pero para inscribir a Fundamentos. Selecciona un Maestro en lugar de un Padre Espiritual.

---

## 16. Flujo completo

### 16.1 Inicio de sesión

```
1. Usuario entra a http://localhost:4200
2. El authGuard detecta que no hay sesión → redirige a /login
3. Usuario escribe usuario y contraseña
4. Hace clic en "Iniciar Sesión"
5. POST /api/auth/login/
6. Backend verifica credenciales
7. ¿Correcto? → Guarda tokens en localStorage → redirige a /dashboard
8. ¿Incorrecto? → Muestra "Credenciales inválidas"
```

### 16.2 Ver personas

```
1. Usuario hace clic en "Personas" en el sidebar
2. GET /api/persons/
3. Backend filtra según el rol:
   - Admin: todas las personas
   - Padre Espiritual: solo las suyas
4. Muestra tabla con datos
5. Las tarjetas de estadísticas se cargan con GET /api/persons/stats/
```

### 16.3 Crear persona (admin)

```
1. Admin hace clic en "+ Nueva Persona"
2. Se abre modal de creación
3. Llena formulario (nombres, documento, teléfono, especialidad, género)
4. Hace clic en "Guardar"
5. POST /api/persons/ con FormData
6. Backend: crea Person → asigna padre espiritual → crea Call #1 → notifica WhatsApp
7. Frontend: cierra modal, recarga la lista, muestra toast ✅
```

### 16.4 Registrar llamada (asesor)

```
1. Asesor va a /calls
2. Ve sus llamadas pendientes en el semáforo (verde = mucho tiempo)
3. Hace clic en ✅ de una llamada
4. Se abre modal: selecciona "Efectiva" o "No Efectiva", escribe notas
5. Dibuja firma (opcional)
6. Hace clic en "Guardar"
7. POST /api/calls/{id}/record_call/
8. Backend:
   - Marca llamada como hecha
   - Si efectiva y no es #3: crea siguiente llamada
   - Si #3 efectiva: persona = efectiva, libera cupo
   - Si #3 no efectiva: persona = no efectiva, desactiva
   - Intenta enviar WhatsApp
9. Frontend: recarga, muestra toast
```

### 16.5 Editar llamada

```
1. Asesor/Admin hace clic en ✏️ de una llamada
2. Se abre modal de edición
3. Cambia estado de "No Efectiva" a "Efectiva" (o viceversa)
4. PATCH /api/call-details/{id}/
5. Backend detecta el cambio y actúa:
   
   not_effective → effective:
   - #1 o #2: crea siguiente llamada si no existe
   - #3: persona = efectiva, completa proceso
   
   effective → not_effective:
   - #1 o #2: borra siguiente llamada
   - #3: persona = no efectiva, desactiva, restaura contador

6. Frontend: recarga, muestra toast
```

### 16.6 Crear llamada manual (admin)

```
1. Admin va a /calls
2. Hace clic en "+ Nueva Llamada"
3. Selecciona persona no efectiva, número de llamada, asesor
4. POST /api/calls/
5. Backend:
   - scheduled_date = timezone.now()
   - Si persona inactiva: borra solo calls desde ese número
     (call #2: borra #2 y #3, conserva #1)
     (call #3: borra solo #3, conserva #1 y #2)
   - Envía WhatsApp: notify_call_recorded (sin "primera llamada")
6. Frontend: recarga, muestra toast
```

### 16.7 Dashboard

```
1. Admin va a /dashboard
2. Selecciona período (semanal/mensual/anual)
3. GET /api/dashboard/report/?period=monthly
4. Muestra tarjetas con números
5. Renderiza gráfica de barras con tendencias
6. Admin hace clic en tarjetas para ocultar/mostrar datasets
7. Admin hace clic en una barra → drill-down (año→mes, mes→semana)
```
