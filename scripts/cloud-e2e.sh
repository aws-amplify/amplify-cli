#!/bin/bash -e

source ./scripts/cloud-cli-utils.sh
export CURR_BRANCH=$(git branch --show-current)
export E2E_ROLE_NAME=CodeBuildE2E
export E2E_PROFILE_NAME=AmplifyCLIE2E
export E2E_PROJECT_NAME=AmplifyCLI-E2E-Testing

function cloudE2ELocal {
    echo Running Local E2E Test Suite
    triggerProjectBatch $E2E_ACCOUNT_LOCAL $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Local" $E2E_PROJECT_NAME $CURR_BRANCH
}
function cloudE2EBeta {
    echo Running Beta E2E Test Suite
    triggerProjectBatch $E2E_ACCOUNT_BETA $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Beta" $E2E_PROJECT_NAME $CURR_BRANCH
}
function cloudE2E {
    echo Running Prod E2E Test Suite
    if [[-z "$USER"]]; then
        export TARGET_BRANCH=run-cb-e2e/$USER/$CURR_BRANCH
    else
        export TARGET_BRANCH=run-cb-e2e/$USERNAME/$CURR_BRANCH
    fi
    git push $(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}') $CURR_BRANCH:$TARGET_BRANCH --no-verify --force-with-lease
    triggerProjectBatch $E2E_ACCOUNT_PROD $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Prod" $E2E_PROJECT_NAME $TARGET_BRANCH
}
