#!/usr/bin/env bash

node build.js
mkdir -p dist/build/Release
cp node_modules/bdb/build/Release/leveldown.node dist/build/Release/leveldown.node
cp node_modules/bcrypto/build/Release/bcrypto.node dist/build/Release/bcrypto.node
cp node_modules/goosig/build/Release/goosig.node dist/build/Release/goosig.node
cp node_modules/mrmr/build/Release/mrmr.node dist/build/Release/mrmr.node
cp node_modules/hsd/lib/covenants/names.db dist
