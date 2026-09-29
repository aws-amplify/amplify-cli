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
    if [[ -n "$USER" ]]; then
        export TARGET_BRANCH=run-cb-e2e/$USER/$CURR_BRANCH
    elif [[ -n "$USERNAME" ]]; then
        export TARGET_BRANCH=run-cb-e2e/$USERNAME/$CURR_BRANCH
    else
        echo "Error: Both USER and USERNAME variables are not set."
        exit 1
    fi
    git push $(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}') $CURR_BRANCH:$TARGET_BRANCH --no-verify --force-with-lease
    triggerProjectBatch $E2E_ACCOUNT_PROD $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Prod" $E2E_PROJECT_NAME $TARGET_BRANCH
}
# Alternative split execution mode: fires TWO separate CodeBuild batches against the SAME
# AmplifyCLI-E2E-Testing project — one Linux-only, one Windows-only — via --buildspec-override.
# This dodges the CoFaWorkflows orchestrator "Internal Service Error" that faults when a single
# batch fans out ~250 shards, by giving each orchestration workflow roughly half the graph and
# isolating Windows. Both batches share artifacts through the source-version-keyed S3 caches.
# The combined-batch cloudE2E above is left intact; this is purely additive.
function cloudE2ESplit {
    echo Running Prod E2E Test Suite in SPLIT mode "(separate Linux + Windows batches)"
    if [[ -n "$USER" ]]; then
        export TARGET_BRANCH=run-cb-e2e/$USER/$CURR_BRANCH
    elif [[ -n "$USERNAME" ]]; then
        export TARGET_BRANCH=run-cb-e2e/$USERNAME/$CURR_BRANCH
    else
        echo "Error: Both USER and USERNAME variables are not set."
        exit 1
    fi
    git push $(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}') $CURR_BRANCH:$TARGET_BRANCH --no-verify --force-with-lease
    echo "--- Triggering Linux batch ---"
    triggerProjectBatch $E2E_ACCOUNT_PROD $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Prod" $E2E_PROJECT_NAME $TARGET_BRANCH "" codebuild_specs/e2e_workflow_linux_generated.yml 360
    echo "--- Triggering Windows batch ---"
    triggerProjectBatch $E2E_ACCOUNT_PROD $E2E_ROLE_NAME "${E2E_PROFILE_NAME}Prod" $E2E_PROJECT_NAME $TARGET_BRANCH "" codebuild_specs/e2e_workflow_windows_generated.yml 360
    echo "Both batches triggered. Use the two Batch IDs printed above with 'yarn wait-for-all-codebuild-split <linuxBatchId> <windowsBatchId>' to poll aggregate pass/fail."
}
