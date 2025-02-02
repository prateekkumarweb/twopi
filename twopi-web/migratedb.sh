#!/bin/bash

mkdir -p $TWOPI_DATA_DIR/database

pnpm run auth:migrate
