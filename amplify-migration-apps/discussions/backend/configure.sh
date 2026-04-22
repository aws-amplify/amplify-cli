#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/discussions/schema.graphql
cp -f ${script_dir}/fetchuseractivity.cjs ${script_dir}/../amplify/backend/function/fetchuseractivity/src/index.js
cp -f ${script_dir}/fetchuseractivity.package.json ${script_dir}/../amplify/backend/function/fetchuseractivity/src/package.json
cp -f ${script_dir}/recorduseractivity.cjs ${script_dir}/../amplify/backend/function/recorduseractivity/src/index.js
cp -f ${script_dir}/recorduseractivity.package.json ${script_dir}/../amplify/backend/function/recorduseractivity/src/package.json

# Activity trigger function
cp -f ${script_dir}/activityTrigger.cjs ${script_dir}/../amplify/backend/function/activityTrigger/src/index.js
cp -f ${script_dir}/activityTrigger.package.json ${script_dir}/../amplify/backend/function/activityTrigger/src/package.json
