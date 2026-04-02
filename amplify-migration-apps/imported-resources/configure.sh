#!/bin/bash

set -euxo pipefail

cp -f schema.graphql ./amplify/backend/api/importedresources/schema.graphql
cp -f quotegenerator.js ./amplify/backend/function/importedresourcequotegenerator/src/index.js
