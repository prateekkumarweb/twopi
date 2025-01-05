#!/bin/bash

for file in ./prisma/database/*.db
do
  file=$(basename $file)
  DATABASE_URL="file:./database/$file" pnpm run db:migrate
done
