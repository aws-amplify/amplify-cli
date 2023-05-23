#!/bin/bash
source ./scripts/cloud-cli-utils.sh
export RELEASE_ROLE_NAME=CodebuildRelease
export RELEASE_PROFILE_NAME=AmplifyCLIRelease
export RC_PROJECT_NAME=RC

function releaseRCLocal {
    echo Running Local RC
    if [[ -z ${1+x} ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short "$1")
    branch_name="release_rc/$rc_sha"
    git checkout -B "$branch_name" "$rc_sha"
    git push "origin" "$branch_name"

    triggerProjectBatch $RELEASE_ACCOUNT_LOCAL $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Local" $RC_PROJECT_NAME $branch_name
}
function releaseRCBeta {
    echo Running Beta RC
    echo You must be on the Beta repository to perform this action, or build will fail.
    if [[ -z ${1+x} ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short "$1")
    branch_name="release_rc/$rc_sha"
    git checkout -B "$branch_name" "$rc_sha"
    git push "origin" "$branch_name"
    triggerProjectBatch $RELEASE_ACCOUNT_BETA $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Beta" $RC_PROJECT_NAME $branch_name
}
function releaseRCProd {
    echo Running Prod RC
    if [[ -z ${1+x} ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    source ./scripts/release-rc.sh $1
    branch_name=$(git branch --show-current)
    triggerProjectBatch $RELEASE_ACCOUNT_PROD $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Prod" $RC_PROJECT_NAME $branch_name
}
