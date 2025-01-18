#!/bin/bash

mkdir -p $TWOPI_DATA_DIR/database

pnpm run auth:migrate

for file in $TWOPI_DATA_DIR/database/*.db
do
  [ -f "$TWOPI_DATA_DIR/database/$file" ] || continue
  file=$(basename $file)
  echo "Migrating file:$TWOPI_DATA_DIR/database/$file"
  DATABASE_URL="file:$TWOPI_DATA_DIR/database/$file" pnpm run db:migrate
done
