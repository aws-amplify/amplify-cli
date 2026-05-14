#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/largescale/schema.graphql
cp -f ${script_dir}/quotegenerator.js ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/index.js
cp -f ${script_dir}/quotegenerator.package.json ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/package.json
