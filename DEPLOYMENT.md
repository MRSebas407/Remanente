# Manual de Despliegue — App Iglesia

## Arquitectura

```
                      Tailscale (100.x.x.x:443)
                              │
                     ┌────────▼────────┐
                     │   nginx:443     │ ← SSL (Let's Encrypt)
                     │ (proxy inverso) │
                     └──┬──────┬──────┬┘
                        │      │      │
              ┌─────────┘ ┌────┘ ┌────┘
              ▼            ▼      ▼
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

Los siguientes archivos están en la rama `deployment`:

| Archivo | Propósito |
|---|---|
| `docker-compose.prod.yml` | Orquestación producción con nginx + 2 PostgreSQL |
| `Dockerfile.prod` | Multi-stage: compila Angular, luego construye Python |
| `nginx/nginx.conf` | Proxy inverso, SSL, security headers |
| `deploy.sh` | Script de despliegue automatizado |
| `.gitignore.production` | Gitignore más restrictivo para seguridad |

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
SECRET_KEY=<generar una clave segura>
DJANGO_ALLOWED_HOSTS=www.remanente.com
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://www.remanente.com
CSRF_TRUSTED_ORIGINS=https://www.remanente.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

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

## Paso 6 — SSL con Let's Encrypt

```bash
sudo apt install -y certbot

# Obtener certificado (ejecutar como root)
sudo certbot certonly --standalone -d www.remanente.com

# Los certificados quedan en:
#   /etc/letsencrypt/live/www.remanente.com/fullchain.pem
#   /etc/letsencrypt/live/www.remanente.com/privkey.pem

# Copiarlos donde nginx los lea
cp /etc/letsencrypt/live/www.remanente.com/fullchain.pem /opt/appiglesia/nginx/ssl/
cp /etc/letsencrypt/live/www.remanente.com/privkey.pem  /opt/appiglesia/nginx/ssl/

# Renovación automática (certbot programa un timer de systemd)
sudo certbot renew --dry-run
```

### Si usas Tailscale Funnel

Con Funnel **no necesitas Let's Encrypt**, Tailscale maneja SSL automáticamente en el dominio `*.ts.net`. Pero si quieres tu dominio personal, sigue la Opción B (VPS proxy).

## Paso 7 — Desplegar

```bash
cd /opt/appiglesia

# Asegúrate de tener .env.production configurado
cp .env.production .env

# Construir y arrancar
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Verificar que todo esté corriendo
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

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

## Solución de problemas

| Problema | Causa posible | Solución |
|---|---|---|
| `502 Bad Gateway` | Backend no arrancó | `docker compose logs backend` |
| OpenWA no conecta | QR no escaneado | Visitar `/openwa/qr/` y escanear |
| `SECRET_KEY inválida` | No hay `.env` | `cp .env.production .env` |
| Permiso denegado en Docker | Usuario no en grupo docker | `sudo usermod -aG docker $USER` |
| Puerto 80/443 ocupado | Otro servicio (Apache) | `sudo systemctl stop apache2` |
