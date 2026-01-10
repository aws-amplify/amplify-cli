#!/bin/bash

set -euxo pipefail

./configure-schema.sh
./configure-functions.sh