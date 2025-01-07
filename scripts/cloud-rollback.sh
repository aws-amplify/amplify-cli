#!/bin/bash -e

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")
source $scriptDir/.env set

printf 'What version should I rollback to ? '
read ROLLBACK_TARGET_VERSION

if [[ -n $USE_FIDO_KEY ]] ; then
  mwinit -s -f
else
  mwinit
fi

ada cred update --profile=AmplifyCLIReleaseProd --account=$RELEASE_ACCOUNT_PROD --role=CodebuildRelease --provider=isengard --once
RESULT=$(aws codebuild start-build-batch \
--profile=AmplifyCLIReleaseProd \
--region us-east-1 \
--project-name Rollback \
--build-timeout-in-minutes-override 60 \
--source-version "dev" \
--debug-session-enabled \
--git-clone-depth-override=1000 \
--environment-variables-override name=ROLLBACK_TARGET_VERSION,value=$ROLLBACK_TARGET_VERSION,type=PLAINTEXT \
--query 'buildBatch.id' --output text)

echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$RELEASE_ACCOUNT_PROD/projects/Rollback/batch/$RESULT?region=us-east-1"
