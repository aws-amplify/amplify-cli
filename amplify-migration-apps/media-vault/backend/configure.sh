#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/mediavault/schema.graphql
cp -f ${script_dir}/thumbnailgen.js ${script_dir}/../amplify/backend/function/thumbnailgen/src/index.js
cp -f ${script_dir}/addusertogroup.js ${script_dir}/../amplify/backend/function/addusertogroup/src/index.js
cp -f ${script_dir}/addusertogroup.package.json ${script_dir}/../amplify/backend/function/addusertogroup/src/package.json
cp -f ${script_dir}/removeuserfromgroup.js ${script_dir}/../amplify/backend/function/removeuserfromgroup/src/index.js
cp -f ${script_dir}/removeuserfromgroup.package.json ${script_dir}/../amplify/backend/function/removeuserfromgroup/src/package.json
