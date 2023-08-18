#!/bin/bash
source ./scripts/cloud-cli-utils.sh
export RELEASE_ROLE_NAME=CodebuildRelease
export RELEASE_PROFILE_NAME=AmplifyCLIRelease
export RC_PROJECT_NAME=RC
export TAGGED_RC_PROJECT_NAME=TaggedReleaseWithoutE2E
export RELEASE_PROJECT_NAME=Release

############################## RC ##############################
function RCLocal {
    echo Running Local RC
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short=15 "$0")
    branch_name="release_rc/$rc_sha"
    git checkout -B "$branch_name" "$rc_sha"
    git push "origin" "$branch_name"
    triggerProjectBatch $RELEASE_ACCOUNT_LOCAL $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Local" $RC_PROJECT_NAME $branch_name
}
function RCBeta {
    echo Running Beta RC
    echo You must be on the Beta repository to perform this action, or build will fail.
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short=15 "$0")
    branch_name="release_rc/$rc_sha"
    git checkout -B "$branch_name" "$rc_sha"
    git push "origin" "$branch_name"
    triggerProjectBatch $RELEASE_ACCOUNT_BETA $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Beta" $RC_PROJECT_NAME $branch_name
}
function RCProd {
    echo Running Prod RC
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    source ./scripts/release-rc-codebuild.sh $0
    branch_name=$(git branch --show-current)
    triggerProjectBatch $RELEASE_ACCOUNT_PROD $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Prod" $RC_PROJECT_NAME $branch_name
}
############################## Tagged RC ##############################
# Follow the steps here https://quip-amazon.com/RX9eASbegQzo/Tagged-release-steps
# and create an upstream branch (not in your fork, but in parent)
# with the name tagged-release-without-e2e-tests/<tag-name>
function TaggedRCLocal {
    echo Running Local Tagged RC
    branch_name=$(git branch --show-current)
    triggerProjectBatch $RELEASE_ACCOUNT_LOCAL $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Local" $TAGGED_RC_PROJECT_NAME $branch_name
}
function TaggedRCBeta {
    echo Running Beta Tagged RC
    branch_name=$(git branch --show-current)
    triggerProjectBatch $RELEASE_ACCOUNT_BETA $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Beta" $TAGGED_RC_PROJECT_NAME $branch_name
}
function TaggedRCProd {
    echo Running Prod Tagged RC
    branch_name=$(git branch --show-current)
    triggerProjectBatch $RELEASE_ACCOUNT_PROD $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Prod" $TAGGED_RC_PROJECT_NAME $branch_name
}
############################## RELEASE ##############################
function ReleaseLocal {
    echo Running Local Release
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short=15 "$0")
    rc_branch="release_rc/$rc_sha"
    git checkout "$rc_branch"
    git push "origin" "$rc_branch"~1:refs/heads/release
    branch_name=release
    triggerProjectBatch $RELEASE_ACCOUNT_LOCAL $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Local" $RELEASE_PROJECT_NAME $branch_name
}
function ReleaseBeta {
    echo Running Beta Release
    echo You must be on the Beta repository to perform this action, or build will fail.
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    rc_sha=$(git rev-parse --short=15 "$0")
    rc_branch="release_rc/$rc_sha"
    git checkout "$rc_branch"
    git push "origin" "$rc_branch"~1:refs/heads/release
    branch_name=release
    triggerProjectBatch $RELEASE_ACCOUNT_BETA $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Beta" $RELEASE_PROJECT_NAME $branch_name
}
function ReleaseProd {
    echo Running Prod Release
    if [[ $0 == 'bash' || -z $0 ]]; then
        echo "Include the release candidate commit ref you wish to release as the first argument"
        exit 1
    fi
    source ./scripts/promote-rc-codebuild.sh $0
    branch_name=release
    triggerProjectBatch $RELEASE_ACCOUNT_PROD $RELEASE_ROLE_NAME "${RELEASE_PROFILE_NAME}Prod" $RELEASE_PROJECT_NAME $branch_name
}
