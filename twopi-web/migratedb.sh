#!/bin/bash

files=$(ls ./)

for file in $files
do
  DATABASE_URL="file:./database/$file" pnpm run db:migrate
done
