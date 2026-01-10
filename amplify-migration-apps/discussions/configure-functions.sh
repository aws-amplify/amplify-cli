#!/bin/bash

set -euxo pipefail

cp -f fetchuseractivity.cjs ./amplify/backend/function/fetchuseractivity/src/index.js
cp -f recorduseractivity.cjs ./amplify/backend/function/recorduseractivity/src/index.js
