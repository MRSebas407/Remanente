# ──────────────────────────────────────────────
# Dockerfile.nginx — Servidor web para producción
# Construye Angular y sirve los archivos estáticos
#
# Build args:
#   NGINX_CONF=nginx.conf       → local (sin SSL, default)
#   NGINX_CONF=nginx.conf.prod  → producción (SSL)
# ──────────────────────────────────────────────

# === Stage 1: Build Angular ===
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build -- --configuration production

# === Stage 2: Nginx con los estáticos ===
FROM nginx:alpine

ARG NGINX_CONF=nginx.conf

# Config de nginx
COPY nginx/${NGINX_CONF} /etc/nginx/nginx.conf

# Angular compilado — SOLO archivos estáticos:
#   index.html, *.js, *.css, assets (imágenes, fuentes)
#   ❌ NO hay .ts (TypeScript se compila a JS en el build)
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
