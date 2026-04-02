#!/bin/bash

set -euxo pipefail

api_name=$(ls amplify/backend/api)
s3_trigger_function_name=$(ls amplify/backend/function | grep S3Trigger)

cp -f schema.graphql ./amplify/backend/api/${api_name}/schema.graphql
cp -f lowstockproducts.js ./amplify/backend/function/lowstockproducts/src/index.js
cp -f lowstockproducts.package.json ./amplify/backend/function/lowstockproducts/src/package.json
cp -f onimageuploaded.js ./amplify/backend/function/${s3_trigger_function_name}/src/index.js
cp -f onimageuploaded.package.json ./amplify/backend/function/${s3_trigger_function_name}/src/package.json
cp -f custom-roles.json ./amplify/backend/api/${api_name}/custom-roles.json
