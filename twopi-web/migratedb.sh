#!/bin/bash

pnpm run auth:migrate

for file in $DATABASE_ABS_PATH/*.db
do
  [ -f "$DATABASE_ABS_PATH/$file" ] || continue
  file=$(basename $file)
  echo "Migrating file:$DATABASE_ABS_PATH/$file"
  DATABASE_URL="file:$DATABASE_ABS_PATH/$file" pnpm run db:migrate
done
