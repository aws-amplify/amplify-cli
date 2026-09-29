#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

s3_trigger_function_name=$(ls ${script_dir}/../amplify/backend/function | grep S3Trigger)

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/productcatalog/schema.graphql
cp -f ${script_dir}/lowstockproducts.js ${script_dir}/../amplify/backend/function/lowstockproducts/src/index.js
cp -f ${script_dir}/lowstockproducts.package.json ${script_dir}/../amplify/backend/function/lowstockproducts/src/package.json
cp -f ${script_dir}/onimageuploaded.js ${script_dir}/../amplify/backend/function/${s3_trigger_function_name}/src/index.js
cp -f ${script_dir}/onimageuploaded.package.json ${script_dir}/../amplify/backend/function/${s3_trigger_function_name}/src/package.json
cp -f ${script_dir}/custom-roles.json ${script_dir}/../amplify/backend/api/productcatalog/custom-roles.json
