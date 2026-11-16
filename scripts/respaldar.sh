#!/usr/bin/env sh
# Respaldo de la base de datos de NexoLab (D-48).
# Uso (desde la raíz del proyecto, con la base levantada):  sh scripts/respaldar.sh
# Crea respaldos/nexolab_AAAAMMDD_HHMM.sql. La carpeta respaldos/ no se sube a Git: contiene datos reales.
set -eu

cd "$(dirname "$0")/.."
mkdir -p respaldos
archivo="respaldos/nexolab_$(date +%Y%m%d_%H%M).sql"

# pg_dump corre dentro del contenedor "db" con el usuario y la base que definió el .env de la raíz.
# --clean --if-exists: el archivo borra las tablas antes de recrearlas, así se puede restaurar sobre una base con datos.
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' > "$archivo"

echo "Respaldo creado: $archivo ($(du -h "$archivo" | cut -f1))"
