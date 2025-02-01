#!/bin/bash

./migratedb.sh

../twopi-service &

node ./.output/server/index.mjs &

wait -n
exit $?
