#!/bin/bash

set -euxo pipefail

cp -f schema.graphql ./amplify/backend/api/mediavault/schema.graphql
cp -f thumbnailgen.js ./amplify/backend/function/thumbnailgen/src/index.js
cp -f addusertogroup.js ./amplify/backend/function/addusertogroup/src/index.js
cp -f addusertogroup.package.json ./amplify/backend/function/addusertogroup/src/package.json
cp -f removeuserfromgroup.js ./amplify/backend/function/removeuserfromgroup/src/index.js
cp -f removeuserfromgroup.package.json ./amplify/backend/function/removeuserfromgroup/src/package.json
