#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Remove old single schema.graphql if it exists and replace with schema directory (split graphql files)
rm -f ${script_dir}/../amplify/backend/api/largescale/schema.graphql
rm -rf ${script_dir}/../amplify/backend/api/largescale/schema
cp -rf ${script_dir}/schema ${script_dir}/../amplify/backend/api/largescale/schema
cp -f ${script_dir}/quotegenerator.js ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/index.js
cp -f ${script_dir}/quotegenerator.package.json ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/package.json
