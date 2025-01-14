#!/bin/bash

for file in $DATABASE_ABS_PATH/*.db
do
  file=$(basename $file)
  DATABASE_URL="file:$DATABASE_ABS_PATH/$file" pnpm run db:migrate
done
