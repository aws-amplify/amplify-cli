#!/bin/bash

set -euxo pipefail

cp -f restapi.js ./amplify/backend/function/lognutrition/src/app.js
