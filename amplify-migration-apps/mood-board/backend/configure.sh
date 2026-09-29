#!/bin/bash

set -euxo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -f ${script_dir}/schema.graphql ${script_dir}/../amplify/backend/api/moodboard/schema.graphql
cp -f ${script_dir}/getRandomEmoji.js ${script_dir}/../amplify/backend/function/moodboardGetRandomEmoji/src/index.js
cp -f ${script_dir}/kinesisReader.js ${script_dir}/../amplify/backend/function/moodboardKinesisReader/src/index.js

cp -f ${script_dir}/kinesisTrigger.js ${script_dir}/../amplify/backend/function/moodboardKinesisTrigger/src/index.js
