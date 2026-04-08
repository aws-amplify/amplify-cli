#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/discussions/schema.graphql
cp -f ${script_dir}/fetchuseractivity.cjs ${script_dir}/../amplify/backend/function/fetchuseractivity/src/index.js
cp -f ${script_dir}/fetchuseractivity.package.json ${script_dir}/../amplify/backend/function/fetchuseractivity/src/package.json
cp -f ${script_dir}/recorduseractivity.cjs ${script_dir}/../amplify/backend/function/recorduseractivity/src/index.js
cp -f ${script_dir}/recorduseractivity.package.json ${script_dir}/../amplify/backend/function/recorduseractivity/src/package.json

# Activity trigger function (name has a hash suffix that varies per project)
trigger_dir=$(ls -d ${script_dir}/../amplify/backend/function/activityTrigger* 2>/dev/null | head -1)
if [ -n "$trigger_dir" ]; then
  cp -f ${script_dir}/activityTrigger.cjs ${trigger_dir}/src/index.js
  cp -f ${script_dir}/activityTrigger.package.json ${trigger_dir}/src/package.json
fi
