#!/bin/bash

set -euxo pipefail

cp -f fetchuseractivity.cjs ./amplify/backend/function/fetchuseractivity/src/index.js
cp -f fetchuseractivity.package.json ./amplify/backend/function/fetchuseractivity/src/package.json
cp -f recorduseractivity.cjs ./amplify/backend/function/recorduseractivity/src/index.js
cp -f recorduseractivity.package.json ./amplify/backend/function/recorduseractivity/src/package.json
