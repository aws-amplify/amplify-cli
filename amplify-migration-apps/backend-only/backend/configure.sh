#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -r -f ${script_dir}/schema ${script_dir}/../amplify/backend/api/backendonly/schema
cp -f ${script_dir}/quotegenerator.js ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/index.js
cp -f ${script_dir}/quotegenerator.package.json ${script_dir}/../amplify/backend/function/quotegeneratorbe/src/package.json
