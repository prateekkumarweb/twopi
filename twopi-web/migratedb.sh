#!/bin/bash

mkdir -p $TWOPI_DATA_DIR/database

pnpm run auth:migrate

for file in $TWOPI_DATA_DIR/database/*.db
do
  file=$(basename $file)
  [ -f "$TWOPI_DATA_DIR/database/$file" ] || continue
  echo "Migrating file:$TWOPI_DATA_DIR/database/$file"
  DATABASE_URL="file:$TWOPI_DATA_DIR/database/$file" pnpm run db:migrate
done
