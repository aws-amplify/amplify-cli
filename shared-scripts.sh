#!/bin/bash

# We have custom caching for our CodeBuild pipelines
# which allows us to share caches with jobs in the same batch
storeCache() {
    localPath="$1"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$localPath"
    echo "writing cache to $s3Path"
    # zip contents and upload to s3
    if ! (cd $localPath && tar czv . | aws s3 cp - $s3Path); then
        echo "Something went wrong storing the cache."
    fi
    echo "done writing cache"
    cd $CODEBUILD_SRC_DIR
}
loadCache() {
    localPath="$1"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$localPath"
    echo "loading cache from $s3Path"
    # create directory if it doesn't exist yet
    mkdir -p $localPath
    # check if cache exists in s3
    if ! aws s3 ls $s3Path > /dev/null; then
        echo "Cache not found."
        exit 0
    fi
    # load cache and unzip it
    if ! (cd $localPath && aws s3 cp $s3Path - | tar xzv); then
        echo "Something went wrong fetching the cache. Continuing anyway."
    fi
    echo "done loading cache"
    cd $CODEBUILD_SRC_DIR
}
_setShell() {
    echo "Setting Shell"
    yarn config set script-shell $(which bash)
}
_buildLinux() {
    _setShell()
    echo "Linux Build"
    # yarn run production-build
    # copy [repo, .cache, and .ssh to s3]
    storeCache $CODEBUILD_SRC_DIR
    storeCache $HOME/.cache
}
_buildWindows() {
    _setShell()
    echo "Windows Build"
    yarn run production-build
    # copy [repo, .cache, and .ssh to s3]
}
_test() {
    echo "Run Test"
    # aws s3 cp s3://$CODEBUILD_BUCKET/$CODEBUILD_BATCH_BUILD_IDENTIFIER/repo $CODEBUILD_SRC_DIR/repo
    # download [repo, .cache from s3]
    yarn test-ci
    echo "collecting coverage"
    yarn coverage
}
_validateCDKVersion() {
    echo "Validate CDK Version"
    # download [repo, .cache from s3]
    yarn ts-node .circleci/validate_cdk_version.ts
}
_lint() {
    # download [repo, .cache from s3]
    echo "Linting"
    yarn lint-check
    yarn lint-check-package-json
    yarn prettier-check
}
_verifyAPIExtract() {
    # download [repo, .cache from s3]
    echo "Verify API Extract"
    yarn verify-api-extract
}
_verifyYarnLock() {
    # download [repo, .cache from s3]
    echo "Verify Yarn Lock"
    yarn verify-yarn-lock
}
_verifyVersionsMatch() {
    # download [repo, .cache, verdaccio-cache from s3]
    echo "Verify Versions Match"
    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    checkPackageVersionsInLocalNpmRegistry
}
_mockE2ETests() {
    # download [repo, .cache from s3]
    source .circleci/local_publish_helpers.sh
    cd packages/amplify-util-mock/
    yarn e2e
}
_publishToLocalRegistry() {
    # download [repo, .cache from s3]
    echo "Publish To Local Registry"
    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    export LOCAL_PUBLISH_TO_LATEST=true
    ./.circleci/publish.sh
    unsetNpmRegistryUrl

    echo "Generate Change Log"
    git reset --soft HEAD~1
    yarn ts-node scripts/unified-changelog.ts
    cat UNIFIED_CHANGELOG.md
    
    echo "Save new amplify Github tag"
    node scripts/echo-current-cli-version.js > .amplify-pkg-version
    # copy [verdaccio-cache, changelog, pkgtag to s3]
}
_uploadPkgBinaries() {
    # download [repo, pkg-binaries, from s3]
    echo "Consolidate binaries cache and upload"
    source .circleci/local_publish_helpers.sh
    uploadPkgCli
    # copy [repo/out to s3]
}
_buildBinaries() {
    # download [repo, yarn, verdaccio from s3]
    echo "Start verdaccio and package CLI"
    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    generatePkgCli linux
    # generatePkgCli macos
    # generatePkgCli win
    # generatePkgCli arm
    
    unsetNpmRegistryUrl
    # copy [repo/out to s3]
}
_runE2ETestsLinux() {
    source .circleci/local_publish_helpers.sh
    source $BASH_ENV
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    amplify version
    cd packages/amplify-e2e-tests
    retry runE2eTest
}
