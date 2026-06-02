#!/bin/sh
# ──────────────────────────────────────────────
# entrypoint.sh — Reemplaza SERVER_TAILSCALE_IP
# y arranca dnsmasq
# ──────────────────────────────────────────────
set -e

if [ -z "$SERVER_TAILSCALE_IP" ]; then
    echo "❌ SERVER_TAILSCALE_IP is not set!"
    echo "   Déjalo vacío para autodetectar con 'tailscale ip -4'"
    echo "   O pásalo como variable de entorno en docker-compose"
    exit 1
fi

sed "s/SERVER_TAILSCALE_IP/$SERVER_TAILSCALE_IP/g" /etc/dnsmasq.conf.template > /etc/dnsmasq.conf

echo "▶️  dnsmasq resolviendo *.remanente.com → $SERVER_TAILSCALE_IP"
exec dnsmasq -k --log-facility=-
