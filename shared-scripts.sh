#!/bin/bash

# set exit on error to true
set -e

# We have custom caching for our CodeBuild pipelines
# which allows us to share caches with jobs in the same batch

# storeCache <local path> <cache location>
function storeCache {
    localPath="$1"
    alias="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo writing cache to $s3Path
    # zip contents and upload to s3
    if ! (cd $localPath && tar cz . | aws s3 cp - $s3Path); then
        echo Something went wrong storing the cache.
    fi
    echo done writing cache
    cd $CODEBUILD_SRC_DIR
}
function storeCacheFile {
    localFilePath="$1"
    alias="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo writing cache to $s3Path
    # zip contents and upload to s3
    if ! (aws s3 cp $localFilePath $s3Path); then
        echo Something went wrong storing the cache.
    fi
    echo done writing cache
    cd $CODEBUILD_SRC_DIR
}
# loadCache <cache location> <local path>
function loadCache {
    alias="$1"
    localPath="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo loading cache from $s3Path
    # create directory if it doesn't exist yet
    mkdir -p $localPath
    # check if cache exists in s3
    if ! aws s3 ls $s3Path > /dev/null; then
        echo "Cache not found."
        exit 0
    fi
    # load cache and unzip it
    if ! (cd $localPath && aws s3 cp $s3Path - | tar xz); then
        echo "Something went wrong fetching the cache. Continuing anyway."
    fi
    echo done loading cache
    cd $CODEBUILD_SRC_DIR
}
function loadCacheFile {
    alias="$1"
    localFilePath="$2"
    s3Path="s3://$CACHE_BUCKET_NAME/$CODEBUILD_SOURCE_VERSION/$alias"
    echo loading cache file from $s3Path
    # check if cache file exists in s3
    if ! aws s3 ls $s3Path > /dev/null; then
        echo "Cache file not found."
        exit 0
    fi
    # load cache file
    if ! (aws s3 cp $s3Path $localFilePath); then
        echo "Something went wrong fetching the cache file. Continuing anyway."
    fi
    echo done loading cache
    cd $CODEBUILD_SRC_DIR
}





function _setShell {
    echo Setting Shell
    yarn config set script-shell $(which bash)
}
function _buildLinux {
    _setShell
    echo Linux Build
    yarn run production-build
    # copy [repo, ~/.cache, and .ssh to s3]
    storeCache $CODEBUILD_SRC_DIR repo
    storeCache $HOME/.cache .cache
}
function _buildWindows {
    _setShell
    echo Windows Build
    yarn run production-build
    # copy [repo, .cache, and .ssh to s3]
    storeCache $CODEBUILD_SRC_DIR repo-windows
    storeCache $HOME/.cache .cache-windows
}
function _testLinux {
    echo Run Test
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    # run tests
    yarn test-ci
    echo collecting coverage
    yarn coverage
}
function _validateCDKVersion {
    echo Validate CDK Version
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    yarn ts-node .circleci/validate_cdk_version.ts
}
function _lint {
    echo Linting
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache

    yarn lint-check
    yarn lint-check-package-json
    yarn prettier-check
}
function _verifyAPIExtract {
    echo Verify API Extract

    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache

    yarn verify-api-extract
}
function _verifyYarnLock {
    echo "Verify Yarn Lock"

    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    
    yarn verify-yarn-lock
}
function _verifyVersionsMatch {
    echo Verify Versions Match

    # download [repo, .cache, verdaccio-cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    loadCache verdaccio-cache $HOME/verdaccio-cache
    
    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    checkPackageVersionsInLocalNpmRegistry
}
function _mockE2ETests {
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache

    source .circleci/local_publish_helpers.sh
    cd packages/amplify-util-mock/
    yarn e2e
}
function _publishToLocalRegistry {
    echo "Publish To Local Registry"
    
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache

    source ./.circleci/local_publish_helpers.sh && startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    source ./.circleci/local_publish_helpers.sh && setNpmRegistryUrlToLocal
    export LOCAL_PUBLISH_TO_LATEST=true
    ./.circleci/publish-codebuild.sh
    unsetNpmRegistryUrl

    echo Generate Change Log
    git reset --soft HEAD~1
    yarn ts-node scripts/unified-changelog.ts
    cat UNIFIED_CHANGELOG.md
    
    echo Save new amplify Github tag
    node scripts/echo-current-cli-version.js > .amplify-pkg-version
    
    echo LS HOME
    ls $HOME

    echo LS REPO
    ls $CODEBUILD_SRC_DIR

    # copy [verdaccio-cache, changelog, pkgtag to s3]
    storeCache $HOME/verdaccio-cache verdaccio-cache
    storeCacheFile $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md UNIFIED_CHANGELOG.md
    storeCacheFile $CODEBUILD_SRC_DIR/.amplify-pkg-version .amplify-pkg-version
}
function _uploadPkgBinaries {
    # download [repo, pkg-binaries, from s3]
    echo Consolidate binaries cache and upload
    source .circleci/local_publish_helpers.sh
    uploadPkgCli
    # copy [repo/out to s3]
}
function _buildBinaries {
    echo Start verdaccio and package CLI
    # download [repo, yarn, verdaccio from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    # loadCache verdaccio-cache $HOME/verdaccio-cache
    loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
    loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    generatePkgCli linux
    # generatePkgCli macos
    # generatePkgCli win
    # generatePkgCli arm
    
    unsetNpmRegistryUrl

    # copy [repo/out to s3]
    storeCache $CODEBUILD_SRC_DIR/out repo-out
}
function _runE2ETestsLinux {
    echo RUN E2E Tests
    
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    # loadCache verdaccio-cache $HOME/verdaccio-cache
    loadCache repo-out $CODEBUILD_SRC_DIR/out
    loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
    loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

    source .circleci/local_publish_helpers.sh
    source $BASH_ENV
    startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    amplify version
    #should just fail here..
    cd packages/amplify-e2e-tests
    retry runE2eTest
}
