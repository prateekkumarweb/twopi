#!/bin/bash

for file in ./prisma/database/*.db
do
  file=$(basename $file)
  DATABASE_URL="file:$DATABASE_ABS_PATH/$file" pnpm run db:migrate
done
