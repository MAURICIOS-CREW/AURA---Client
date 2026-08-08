#!/bin/sh
set -e

# Comprobar si node_modules existe o si faltan las dependencias de Angular
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@angular" ]; then
  echo "📦 Instalando dependencias de Node.js en el directorio..."
  npm install
fi

exec "$@"
