#!/bin/bash -e

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")
source $scriptDir/.env set

printf 'What is your PR number ? '
read PR_NUMBER

if [[ -n $USE_FIDO_KEY ]] ; then
  mwinit -s -f
else
  mwinit
fi

ada cred update --profile=cb-ci-account --account=$E2E_ACCOUNT_PROD --role=CodeBuildE2E --provider=isengard --once
RESULT=$(aws codebuild start-build-batch \
--profile=cb-ci-account \
--region us-east-1 \
--project-name AmplifyCLI-PR-Testing \
--build-timeout-in-minutes-override 180 \
--source-version "pr/$PR_NUMBER" \
--debug-session-enabled \
--git-clone-depth-override=1000 \
--environment-variables-override name=AMPLIFY_CI_MANUAL_PR_BUILD,value=true,type=PLAINTEXT \
--query 'buildBatch.id' --output text)

echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$E2E_ACCOUNT_PROD/projects/AmplifyCLI-PR-Testing/batch/$RESULT?region=us-east-1"
