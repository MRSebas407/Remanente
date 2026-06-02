# Manual de Despliegue — App Iglesia

## Arquitectura

```
             ┌─────────────────────────────────┐
             │       Tailscale (VPN)            │
             │  Split DNS: remanente.com        │
             │  → consulta → dnsmasq:53         │
             │  → responde: 100.x.x.x           │
             └──────────────┬──────────────────┘
                            │
                 http://www.remanente.com
                            │
                     ┌──────▼──────┐
                     │  nginx:80   │ ← HTTP (sin SSL, interno)
                     │ proxy inv.  │
                     └──┬──────┬───┘
                        │      │
              ┌─────────┘ ┌────┘
              ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Angular  │ │ Django   │ │  OpenWA  │
        │ (static) │ │ Gunicorn │ │  :2785   │
        └──────────┘ └────┬─────┘ └─────┬────┘
                          │              │
                     ┌────▼─────┐  ┌────▼──────┐
                     │PostgreSQL│  │PostgreSQL  │
                     │ (app)    │  │ (OpenWA)   │
                     └──────────┘  └────────────┘
```

## Requisitos de hardware

**Mínimo (30 usuarios concurrentes):**
- CPU: 2 núcleos (Intel Celeron / AMD A4 o superior)
- RAM: 4 GB (recomendado 8 GB) — OpenWA (Chromium) consume ~1 GB
- Disco: 20 GB SSD (el cuello de botella real es el disco)
- SO: Ubuntu 24.04 LTS (recomendado)

**Tu laptop (Core i5 5200U, 8 GB RAM):** ✅ **Suficiente**
La RAM se distribuye así:
- PostgreSQL (app): ~200 MB
- OpenWA + Chromium: ~500 MB–1.2 GB
- Django + Gunicorn (4 workers): ~150 MB
- PostgreSQL (OpenWA): ~100 MB
- Nginx + sistema: ~150 MB
- **Total: ~1.2–2.0 GB** → Te sobran 6 GB para el SO y picos.

**Para 100+ usuarios:** 16 GB RAM, separar PostgreSQL a máquina aparte, 6+ workers.

## Estructura de archivos de producción

Los siguientes archivos están en este repositorio (rama `deployment`):

| Archivo | Propósito |
|---|---|
| `docker-compose.prod.yml` | Orquestación producción (nginx + dnsmasq + 2 PostgreSQL) |
| `docker-compose.local.yml` | Override para probar producción localmente |
| `Dockerfile.prod` | Construye el backend Python (API Django) |
| `nginx/Dockerfile` | Construye Angular y lo sirve con nginx |
| `nginx/nginx.conf` | Proxy inverso HTTP (para Tailscale interno, sin SSL) |
| `nginx/nginx.conf.ssl` | Proxy inverso con SSL (para acceso público futuro) |
| `nginx/nginx.conf.local` | Proxy sin SSL para pruebas locales |
| `dnsmasq/Dockerfile` | DNS local para resolver www.remanente.com |
| `dnsmasq/dnsmasq.conf` | Config: resuelve *.remanente.com → IP Tailscale |
| `deploy.sh` | Script de despliegue automatizado |
| `.gitignore.production` | Gitignore más restrictivo para seguridad |
| `.dockerignore` | Excluye .env y archivos sensibles de la imagen Docker |

### ¿Qué archivos llegan al servidor? (IMPORTANTE)

En el servidor de producción **NO hay archivos TypeScript (`.ts`)** ni código fuente de Angular. El proceso es:

```
Código fuente (dev)                Servidor de producción
─────────────────────              ─────────────────────
frontend/src/*.ts      ─┐
frontend/src/*.html    ─┤  ng build ──→  index.html
frontend/src/*.css     ─┤               *.js  (JavaScript puro)
                        │               *.css (CSS compilado)
                        │               assets/ (imágenes, fuentes)
                        └─── TODO esto  └─── SOLO esto
                            NO va al        SÍ va al servidor
                            servidor
```

El `nginx/Dockerfile`:
1. **Stage 1 (build):** Compila Angular (TypeScript → JavaScript)
2. **Stage 2 (runtime):** Toma solo los archivos compilados (`dist/frontend/browser/`) y los copia al directorio de nginx (`/usr/share/nginx/html`)

El resultado dentro del contenedor nginx es:
```
/usr/share/nginx/html/
├── index.html          ← Punto de entrada SPA
├── main-*.js           ← JavaScript compilado
├── polyfills-*.js      ← Polyfills
├── styles-*.css        ← Estilos compilados
├── chunk-*.js          ← Código partido en trozos (lazy loading)
├── favicon.ico
├── logo.png
└── logo.svg
```

**⚠️ Sin archivos `.ts`, sin `node_modules`, sin `package.json`.**

### `.dockerignore` — protege las imágenes Docker

El archivo `.dockerignore` evita que archivos sensibles se copien accidentalmente dentro de la imagen Docker:

```
.env           ← contraseñas, API keys
.env.*         ← cualquier variante de .env
.git           ← historial completo del repo
node_modules   ← pesado e innecesario
__pycache__    ← archivos compilados locales
media          ← fotos/firmas de usuarios (se monta como volumen)
nginx/ssl/*.pem ← certificados SSL
```

**Ejemplo de peligro:** Si no excluyeras `.env`, la imagen Docker contendría todas tus contraseñas. Cualquiera con acceso al registro de imágenes podría extraerlas.

## DNS local con Tailscale (Split DNS)

Cuando accedes desde cualquier dispositivo en tu red Tailscale, `www.remanente.com` se resuelve a la IP del servidor internamente:

```
Dispositivo (laptop/celular)
  → Tailscale enruta la consulta DNS
  → dnsmasq en el servidor (puerto 53)
  → Responde: www.remanente.com = 100.x.x.x (IP del servidor)
  → Navegador abre http://www.remanente.com → nginx
  → nginx sirve Angular o redirige a Django
```

### Configurar Split DNS en Tailscale

```
1. Ve a https://login.tailscale.com/admin/dns
2. En "Split DNS" → "Add domain"
3. Escribe: remanente.com
4. En "Nameserver" selecciona "Custom"
5. Escribe la IP de Tailscale de tu servidor (ej: 100.x.x.x)
6. Guardar
```

### Obtener la IP de Tailscale

```bash
# En el servidor:
tailscale ip -4
# → 100.x.x.x  (este valor va en SERVER_TAILSCALE_IP)
```

### Configurar en `.env`

```bash
# En .env.production del servidor:
SERVER_TAILSCALE_IP=100.x.x.x
```

Esto hace que el contenedor `dnsmasq` responda a las consultas DNS resolviendo `*.remanente.com` a la IP de Tailscale del servidor.

### ¿Qué pasa si no configuro el Split DNS?

Sin Split DNS, puedes acceder igual por la IP directa de Tailscale:
```
http://100.x.x.x
```
Pero no por `www.remanente.com` — los dispositivos no sabrían cómo resolver ese dominio.

## Paso 1 — Instalar el servidor

```bash
# 1. Sistema base
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# 2. Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar, o ejecutar: newgrp docker

# 3. Docker Compose plugin
sudo apt install -y docker-compose-plugin

# 4. Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Aparece un link para autenticar en el navegador
```

## Paso 2 — Firewall

```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 443/tcp      # HTTPS
sudo ufw allow 80/tcp       # HTTP (redirect)
sudo ufw enable
```

Solo abre SSH y HTTP/HTTPS. Todo lo demás (PostgreSQL, OpenWA Dashboard) se queda en la red interna de Docker, no se expone.

## Paso 3 — Clonar repositorio y preparar

```bash
mkdir -p /opt/appiglesia
cd /opt/appiglesia
git clone git@github.com:MRSebas407/Remanente.git .
git checkout deployment

# Crear .env de producción
cp .env.example .env.production
nano .env.production   # <-- ajustar todas las variables
```

## Paso 4 — Variables de entorno para producción

El archivo `.env.production` **NUNCA se sube a git**. Debes crearlo manualmente en el servidor.

### `.env.production` (plantilla a rellenar)

```bash
# === Django ===
DEBUG=False
SECRET_KEY=<generar clave segura>
DJANGO_ALLOWED_HOSTS=www.remanente.com,localhost
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://www.remanente.com
CSRF_TRUSTED_ORIGINS=http://www.remanente.com

# === DNS local (Tailscale) ===
SERVER_TAILSCALE_IP=<IP de Tailscale del servidor>

# === PostgreSQL (app) ===
DB_NAME=appiglesia
DB_USER=appiglesia
DB_PASSWORD=<generar contraseña segura>
DB_HOST=db
DB_PORT=5432

# === PostgreSQL (OpenWA) ===
OPENWA_DB_PASSWORD=<generar contraseña segura>

# === OpenWA WhatsApp ===
OPENWA_BASE_URL=http://openwa:2785/api
OPENWA_API_KEY=<generar API key segura>
OPENWA_SESSION_ID=default
OPENWA_COUNTRY_CODE=57
```

### SERVER_TAILSCALE_IP

```bash
# Obtén la IP de Tailscale del servidor:
tailscale ip -4
# → 100.x.x.x

# En .env.production:
SERVER_TAILSCALE_IP=100.x.x.x
```

### Generar claves seguras

En el servidor, ejecuta:

```bash
python3 -c "
import secrets, string

# Django SECRET_KEY
k = 'django-insecure-' + ''.join(secrets.choice(string.ascii_lowercase + string.digits + '!@#%^&*(-_=+)') for _ in range(64))
print(f'SECRET_KEY={k}')

# OpenWA API key
print(f'OPENWA_API_KEY={secrets.token_hex(32)}')

# PostgreSQL passwords
print(f'DB_PASSWORD={secrets.token_urlsafe(24)}')
print(f'OPENWA_DB_PASSWORD={secrets.token_urlsafe(24)}')
"
```

## Paso 5 — DNS y dominio

### Opción A: Tailscale + IP pública (recomendada para aprender)

Si tu servidor tiene IP pública (aunque sea dinámica):
1. Compra el dominio `www.remanente.com` en Namecheap o类似
2. Crea un registro A que apunte a tu IP pública
3. Configura DDNS si tu IP es dinámica (Namecheap tiene DDNS gratis)

### Opción B: Solo Tailscale (sin IP pública)

Tailscale da IPs privadas `100.x.x.x` a todos tus dispositivos. Puedes acceder internamente, pero el dominio público no resolverá.

**Solución:** Usa un **VPS pequeñito** (DigitalOcean $6/mes, Linode $5/mes, o una Raspberry en tu casa con IP pública) que haga de proxy reverso hacia tu servidor via Tailscale:

```
Usuario → www.remanente.com → VPS (nginx) → Tailscale → Servidor real (100.x.x.x)
```

### Opción C: Tailscale Funnel (beta, gratuito)

Tailscale Funnel expone un puerto local a internet mediante los servidores de Tailscale:

```bash
sudo tailscale funnel --bg 443
```

Así puedes acceder desde cualquier lugar sin IP pública. El dominio sería algo como `remanente.tailnet-name.ts.net`.

## Paso 6 — DNS local vs SSL

Como usas **Tailscale interno sin IP pública**, no necesitas SSL/HTTPS. El acceso es:

```
http://www.remanente.com → dnsmasq → 100.x.x.x → nginx:80 → app
```

**No necesitas Let's Encrypt ni certificados SSL** porque todo el tráfico va dentro de tu red privada de Tailscale. No hay internet público de por medio.

### Si en el futuro quisieras SSL público

Cuando quieras exponer la página a internet real (no solo Tailscale):

```
1. Consigues una VPS con IP pública
2. Instalas nginx con SSL (certbot)
3. El archivo nginx/nginx.conf.ssl ya está listo para usar
4. Construyes con: NGINX_CONF=nginx.conf.ssl
5. El VPS hace proxy reverso via Tailscale hacia tu servidor
```

## Paso 7 — Desplegar

```bash
cd /opt/appiglesia

# Asegúrate de tener .env.production configurado
cp .env.production .env

# La IP de Tailscale debe estar en SERVER_TAILSCALE_IP en el .env
grep SERVER_TAILSCALE_IP .env  # debe mostrar: SERVER_TAILSCALE_IP=100.x.x.x

# Construir y arrancar
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Verificar que todo esté corriendo
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### Servicios que arrancan

| Contenedor | Función |
|---|---|
| `dnsmasq` | Resuelve `www.remanente.com` → `100.x.x.x` (DNS local) |
| `nginx` | Sirve Angular + proxy a Django (puerto 80) |
| `backend` | Django + Gunicorn (API) |
| `db` | PostgreSQL de la app |
| `openwa-db` | PostgreSQL de OpenWA |
| `openwa` | WhatsApp API |
| `dashboard` | Panel de administración de OpenWA |

## Paso 8 — Conectar OpenWA WhatsApp

```
1. Accede a https://www.remanente.com/openwa/qr/
2. Escanea el código QR con WhatsApp Web en tu celular
3. Verifica estado: el dashboard de OpenWA debe mostrar "Connected"
```

## Paso 9 — Sembrar datos iniciales

El seed se ejecuta automáticamente al iniciar el contenedor backend. Crea:

| Usuario | Rol | Contraseña |
|---|---|---|
| admin | Administrador | admin123 |
| padre1 | Padre Espiritual (M) | 123456 |
| padre2 | Padre Espiritual (Joven, F) | 123456 |
| maestro1 | Maestro | 123456 |

**⚠️ Seguridad:** Cambia estas contraseñas inmediatamente después del primer inicio de sesión.

## Mantenimiento diario

### Actualizar la app

```bash
cd /opt/appiglesia
git pull origin deployment
cp .env.production .env
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml up -d
```

**O usa el script:** `bash deploy.sh` (hace todo automáticamente)

### Ver logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend   # Solo Django
docker compose -f docker-compose.prod.yml logs -f nginx     # Solo nginx
docker compose -f docker-compose.prod.yml logs -f openwa    # Solo WhatsApp
```

### Respaldar base de datos

```bash
# Backup automático (agregar a crontab: 0 3 * * *)
docker exec -t db pg_dump -U appiglesia appiglesia > backup_$(date +%Y%m%d).sql
```

## Flujo de trabajo con git (ramas)

```
master (desarrollo)
    │
    ▼
deployment (producción)
    │
    ▼
Servidor (git pull origin deployment)
```

**En tu máquina de desarrollo:**
```bash
# Trabajar en master
git checkout master
# ... hacer cambios, commits ...
git push origin master

# Fusionar a deployment
git checkout deployment
git merge master
git push origin deployment
```

**En el servidor:**
```bash
cd /opt/appiglesia
git pull origin deployment
bash deploy.sh
```

## Seguridad

### Archivos excluidos en rama deployment

El archivo `.gitignore.production` excluye:

| Patrón | Motivo |
|---|---|
| `.env` `.env.production` | Contienen claves y contraseñas |
| `nginx/ssl/*.pem` `*.key` | Certificados SSL privados |
| `media/` | Archivos subidos por usuarios |
| `staticfiles/` | Generado por collectstatic |
| `**/secret*` `**/secrets*` | Prevención de fugas accidentales |

**⚠️ Regla de oro:** Si contiene una contraseña, API key, certificado o dato personal — **no está en git**.

### Recomendaciones adicionales

1. **Fail2ban:** `sudo apt install fail2ban` — protege SSH de fuerza bruta
2. **Updates automáticos:** `sudo apt install unattended-upgrades`
3. **Monitoreo:** Instala Uptime Kuma (Docker) para health checks
4. **Backups automáticos:** Pon el comando de pg_dump en crontab
5. **Usuario admin solo en DB:** La base de datos de producción solo debe tener el usuario `admin` con contraseña `admin123` para el seed inicial. **Cámbiala inmediatamente.**

## Probar producción localmente

Puedes probar todo el stack de producción en tu máquina sin SSL:

```bash
# 1. Copiar .env de prueba local
cp .env.production.local .env

# 2. Construir las imágenes (nginx con nginx.conf.local, backend sin SSL)
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml build

# 3. Iniciar servicios
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml up -d

# 4. Verificar
curl http://localhost/           # → HTML del frontend
curl http://localhost/api/       # → 401 (API funcionando)
curl http://localhost/admin/     # → 302 (redirect a login)

# 5. Ver logs
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml logs -f

# 6. Detener
docker compose -f docker-compose.prod.yml -f docker-compose.local.yml down
```

El override `docker-compose.local.yml` cambia:
- **nginx:** usa `nginx.conf.local` (sin SSL, solo HTTP)
- **backend:** desactiva SSL redirect, HSTS, cookies seguras

## Solución de problemas

| Problema | Causa posible | Solución |
|---|---|---|
| `502 Bad Gateway` | Backend no arrancó | `docker compose logs backend` |
| `www.remanente.com` no resuelve | Falta Split DNS en Tailscale | Revisar Tailscale Admin → DNS → Split DNS |
| dnsmasq no arranca | SERVER_TAILSCALE_IP no configurado | `docker compose logs dnsmasq` |
| OpenWA no conecta | QR no escaneado | Visitar `/openwa/qr/` y escanear |
| `SECRET_KEY inválida` | No hay `.env` | `cp .env.production .env` |
| Permiso denegado en Docker | Usuario no en grupo docker | `sudo usermod -aG docker $USER` |
| Puerto 80 ocupado | Otro servicio (Apache) | `sudo systemctl stop apache2` |
