#!/bin/bash

set -euxo pipefail

cp -f restapi.js ./amplify/backend/function/lognutrition/src/app.js
cp -f adminapi.js ./amplify/backend/function/admin/src/app.js
cp -f adminapi.package.json ./amplify/backend/function/admin/src/package.json
