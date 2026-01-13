#!/bin/bash

set -euxo pipefail

cp -f schema.graphql ./amplify/backend/api/mediavault/schema.graphql
cp -f thumbnailgen.js ./amplify/backend/function/thumbnailgen/src/index.js
cp -f addusertogroup.js ./amplify/backend/function/addusertogroup/src/index.js
cp -f removeuserfromgroup.js ./amplify/backend/function/removeuserfromgroup/src/index.js
