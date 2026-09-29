#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/projectboards/schema.graphql
cp -f ${script_dir}/quotegenerator.js ${script_dir}/../amplify/backend/function/quotegenerator/src/index.js
