#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p $CERT_DIR

# If certs are already mounted (by user via docker volume), use them
if [ -f "$CERT_DIR/server.pem" ] && [ -f "$CERT_DIR/server-key.pem" ]; then
    echo "Using existing certificates from $CERT_DIR"
else
    # Generate self-signed cert at runtime
    HOST_IPS=${HOST_IP:-127.0.0.1}

    SAN="DNS:localhost"
    CN=""
    OLD_IFS="$IFS"
    IFS=","
    for ip in $HOST_IPS; do
        ip=$(echo "$ip" | xargs)
        SAN="$SAN,IP:$ip"
        [ -z "$CN" ] && CN="$ip"
    done
    IFS="$OLD_IFS"

    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout $CERT_DIR/server-key.pem \
        -out $CERT_DIR/server.pem \
        -subj "/C=EC/O=AppIglesia/CN=$CN" \
        -addext "subjectAltName=$SAN"

    echo "Self-signed certificate generated for: $SAN"
fi

exec nginx -g "daemon off;"
