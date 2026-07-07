#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/fitnesstracker/schema.graphql
cp -f ${script_dir}/restapi.js ${script_dir}/../amplify/backend/function/lognutrition/src/app.js
cp -f ${script_dir}/adminapi.js ${script_dir}/../amplify/backend/function/admin/src/app.js
cp -f ${script_dir}/adminapi.package.json ${script_dir}/../amplify/backend/function/admin/src/package.json
