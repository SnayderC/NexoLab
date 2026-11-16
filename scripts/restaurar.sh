#!/usr/bin/env sh
# Restaura un respaldo creado con scripts/respaldar.sh (D-48).
# Uso (desde la raíz del proyecto, con la base levantada):  sh scripts/restaurar.sh respaldos/nexolab_20261116_1030.sql
# ATENCIÓN: reemplaza TODOS los datos actuales por los del respaldo.
set -eu

cd "$(dirname "$0")/.."
archivo="${1:-}"
if [ -z "$archivo" ] || [ ! -f "$archivo" ]; then
  echo "Indica un archivo de respaldo existente. Ejemplo: sh scripts/restaurar.sh respaldos/nexolab_20261116_1030.sql"
  exit 1
fi

printf 'Esto reemplaza todos los datos actuales por los de %s. ¿Continuar? (escribe si): ' "$archivo"
read -r respuesta
if [ "$respuesta" != "si" ]; then
  echo "Cancelado. No se cambió nada."
  exit 0
fi

# --single-transaction y ON_ERROR_STOP: todo o nada. Si una instrucción falla, se deshace todo y la base queda
# exactamente como estaba antes de restaurar.
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q -v ON_ERROR_STOP=1 --single-transaction' \
  < "$archivo" > /dev/null

echo "Respaldo restaurado. Reinicia el backend para cerrar las sesiones abiertas: docker compose --profile app restart backend"
