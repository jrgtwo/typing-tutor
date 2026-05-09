#!/usr/bin/env bash
# Apply every .sql file in db/migrations in lexical order.
# Migrations are idempotent (`create table if not exists`, etc.), so
# re-running is safe — there's no migration tracking table.
#
# Usage: pnpm db:migrate
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "error: .env not found in $(pwd)" >&2
  exit 1
fi

# auto-export every var defined in .env so psql sees DATABASE_URL
set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set in .env" >&2
  exit 1
fi

shopt -s nullglob
for f in db/migrations/*.sql; do
  echo "── applying $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "done."
