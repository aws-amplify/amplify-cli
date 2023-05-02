#!/bin/bash -eo pipefail
source .circleci/local_publish_helpers.sh
startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
setNpmRegistryUrlToLocal
changeNpmGlobalPath
generatePkgCli linux
unsetNpmRegistryUrl
