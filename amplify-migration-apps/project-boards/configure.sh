#!/bin/bash

set -euxo pipefail

#cp -f schema.graphql ./amplify/backend/api/projectboards/schema.graphql
cp -f quotegenerator.js ./amplify/backend/function/quotegenerator/src/index.js
