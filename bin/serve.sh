#!/usr/bin/env bash
set -euo pipefail

# Inicialização do servidor Laravel padrão para desenvolvimento
# Usa porta 8000 por padrão, altere com PORT=xxxx ./bin/serve.sh

PORT="${PORT:-8000}"

echo "[serve] Iniciando servidor Laravel em 0.0.0.0:${PORT}"
php artisan serve --host=0.0.0.0 --port="${PORT}"

