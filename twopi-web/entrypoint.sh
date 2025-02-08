#!/bin/bash

../twopi-service &

node ./.output/server/index.mjs &

wait -n
exit $?
