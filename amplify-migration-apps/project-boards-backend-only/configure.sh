#!/bin/bash

set -euxo pipefail

cp -f schema.graphql ./amplify/backend/api/backendonly/schema.graphql
cp -f quotegenerator.js ./amplify/backend/function/quotegenerator/src/index.js
cp -f quotegenerator.package.json ./amplify/backend/function/quotegenerator/src/package.json
