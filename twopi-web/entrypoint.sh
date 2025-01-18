#!/bin/bash

./migratedb.sh

../currency-cache &

node ./.output/server/index.mjs &

wait -n
exit $?
