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
function _loadTestAccountCredentials {
    echo ASSUMING PARENT TEST ACCOUNT credentials
    session_id=$((1 + $RANDOM % 10000))
    creds=$(aws sts assume-role --role-arn $TEST_ACCOUNT_ROLE --role-session-name testSession${session_id} --duration-seconds 3600)
    if [ -z $(echo $creds | jq -c -r '.AssumedRoleUser.Arn') ]; then
        echo "Unable to assume parent e2e account role."
        return
    fi
    echo "Using account credentials for $(echo $creds | jq -c -r '.AssumedRoleUser.Arn')"
    export AWS_ACCESS_KEY_ID=$(echo $creds | jq -c -r ".Credentials.AccessKeyId")
    export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -c -r ".Credentials.SecretAccessKey")
    export AWS_SESSION_TOKEN=$(echo $creds | jq -c -r ".Credentials.SessionToken")
}




function _setShell {
    echo Setting Shell
    yarn config set script-shell $(which bash)
}
function _buildLinux {
    _setShell
    echo Linux Build
    yarn run production-build
    yarn build-tests
    storeCache $CODEBUILD_SRC_DIR repo
    storeCache $HOME/.cache .cache
}
function _testLinux {
    echo Run Test
    # download [repo, .cache from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    # run tests
    yarn test-ci
    # echo collecting coverage
    # yarn coverage
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
    loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache
    
    source .circleci/local_publish_helpers.sh && startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
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
    setNpmRegistryUrlToLocal
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
    ls $CODEBUILD_SRC_DIR/..

    echo LS REPO
    ls $CODEBUILD_SRC_DIR

    # copy [verdaccio-cache, changelog, pkgtag to s3]
    storeCache $CODEBUILD_SRC_DIR/../verdaccio-cache verdaccio-cache

    storeCacheFile $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md UNIFIED_CHANGELOG.md
    storeCacheFile $CODEBUILD_SRC_DIR/.amplify-pkg-version .amplify-pkg-version
}
function _uploadPkgBinaries {
    echo Consolidate binaries cache and upload

    loadCache repo $CODEBUILD_SRC_DIR
    loadCache repo-out-arm $CODEBUILD_SRC_DIR/out
    loadCache repo-out-linux $CODEBUILD_SRC_DIR/out
    loadCache repo-out-macos $CODEBUILD_SRC_DIR/out
    loadCache repo-out-win $CODEBUILD_SRC_DIR/out

    echo Done loading binaries
    ls $CODEBUILD_SRC_DIR/out

    # source .circleci/local_publish_helpers.sh
    # uploadPkgCli

    storeCache $CODEBUILD_SRC_DIR/out all-binaries
}
function _buildBinaries {
    echo Start verdaccio and package CLI
    binaryType="$1"
    # download [repo, yarn, verdaccio from s3]
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache

    loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
    loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    generatePkgCli $binaryType
    unsetNpmRegistryUrl

    # copy [repo/out to s3]
    storeCache $CODEBUILD_SRC_DIR/out repo-out-$binaryType
}
function _install_packaged_cli_linux {
    echo INSTALL PACKAGED CLI TO PATH

    cd $CODEBUILD_SRC_DIR/out
    ln -sf amplify-pkg-linux-x64 amplify
    export PATH=$AMPLIFY_DIR:$PATH
    cd $CODEBUILD_SRC_DIR
}
function _runE2ETestsLinux {
    echo RUN E2E Tests Linux
    
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache .cache $HOME/.cache
    loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache

    loadCache all-binaries $CODEBUILD_SRC_DIR/out
    loadCacheFile .amplify-pkg-version $CODEBUILD_SRC_DIR/.amplify-pkg-version
    loadCacheFile UNIFIED_CHANGELOG.md $CODEBUILD_SRC_DIR/UNIFIED_CHANGELOG.md

    _install_packaged_cli_linux

    # verify installation
    amplify version

    source .circleci/local_publish_helpers.sh && startLocalRegistry "$CODEBUILD_SRC_DIR/.circleci/verdaccio.yaml"
    # source $BASH_ENV

    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    amplify version
    
    cd packages/amplify-e2e-tests

    _loadTestAccountCredentials

    retry runE2eTest
}


function _scanArtifacts {
    if ! yarn ts-node .circleci/scan_artifacts_codebuild.ts; then
        echo "Cleaning the repository"
        git clean -fdx
        exit 1
    fi
}

function _putCredsInProfile {
    mkdir -p ~/.aws
    touch ~/.aws/config ~/.aws/credentials 
    python3 codebuild_specs/sh-files/aws-configure-credentials.py
}

function _installIntegTestsDependencies {
    apt-get update
    apt-get install -y sudo
    sudo apt-get install -y tcl
    sudo apt-get install -y expect
    sudo apt-get install -y zip
    sudo apt-get install -y lsof
    sudo apt-get install -y python3 python3-pip libpython3-dev
    sudo apt-get install -y jq
    sudo apt-get install -y libgbm-dev #
    pip install awscli
}

function _integTestAmplifyInit {
    export REACTCONFIG="{\"SourceDir\":\"src\",\"DistributionDir\":\"build\",\"BuildCommand\":\"npm run-script build\",\"StartCommand\":\"npm run-script start\"}"
    export FRONTEND="{\"frontend\":\"javascript\",\"framework\":\"react\",\"config\":$REACTCONFIG}"
    export AMPLIFY_INIT_CONFIG="{\"projectName\":\"unauth\",\"envName\":\"integtest\",\"defaultEditor\":\"code\"}"
    export PROVIDERS="{\"awscloudformation\":$AWSCLOUDFORMATIONCONFIG}"    
    amplify-dev init --amplify $AMPLIFY_INIT_CONFIG --frontend $FRONTEND --providers $PROVIDERS --yes
}

function _addAndPushAuth {
    chmod +x ../amplify-cli/codebuild_specs/sh-files/auth.sh
    chmod +x ../amplify-cli/codebuild_specs/exp-files/enable_auth.exp
    expect ../amplify-cli/codebuild_specs/exp-files/enable_auth.exp
    amplify-dev push --yes
    amplify-dev status
}

function _prepareAuthServer {
    echo "Start Auth test server in background"
    yarn --frozen-lockfile --cache-folder ~/.cache/yarn
    cd src && cat $(find . -type f -name 'aws-exports*') && pwd
    cd .. && pwd
    # export NODE_OPTIONS=--openssl-legacy-provider # necesary on node 18
}

function _runIntegAuthTests {
    cp ../amplify-cli/cypress.json .
    cp -R ../amplify-cli/cypress .
    yarn cypress run --spec $(find . -type f -name 'auth_spec*')
}

function _integrationTest {
    echo "Restoring Cache"
    loadCache repo $CODEBUILD_SRC_DIR
    loadCache verdaccio-cache $CODEBUILD_SRC_DIR/../verdaccio-cache

    echo "Loading test account credentials"
    _loadTestAccountCredentials

    echo "Running aws_configure.sh"
    chmod +x ./codebuild_specs/sh-files/aws.sh
    expect ./codebuild_specs/exp-files/aws_configure.exp

    echo "Adding credentials to default aws profile"
    _putCredsInProfile

    echo "Setting Up Dependencies"
    _installIntegTestsDependencies

    echo "Configuring Amplify CLI"
    yarn rm-dev-link && yarn link-dev && yarn rm-aa-dev-link && yarn link-aa-dev
    export PATH=$(yarn global bin):$PATH # changed from CCI: echo 'export PATH="$(yarn global bin):$PATH"' >> $BASH_ENV. see https://circleci.com/docs/env-vars/#example-configuration-of-environment-variables
    amplify-dev

    echo "Cloning auth test package"
    cd .. && pwd
    git clone $AUTH_CLONE_URL
    cd aws-amplify-cypress-auth && pwd
    yarn --cache-folder ~/.cache/yarn
    yarn add cypress@6.8.0 --save

    echo "Initializing new amplify project"
    cd ../aws-amplify-cypress-auth && pwd
    _integTestAmplifyInit
    
    echo "Adding auth and pushing"
    _addAndPushAuth
    echo "end push"

    echo "preparing auth server"
    _prepareAuthServer
    echo "running auth server in background"

    export NODE_OPTIONS=--openssl-legacy-provider
	nohup yarn start > server_output.txt & disown $!
    echo "Polling for server ready message"
    while ! grep -Fxq "You can now view aws-amplify-cypress-auth in the browser." server_output.txt; do echo "ready message not found yet" && sleep 1; done
	echo "server started"

    echo "Running auth tests now"
    cat $(find ../amplify-cli -type f -name 'auth_spec*')
    export NODE_OPTIONS=--max-old-space-size=5120
    _runIntegAuthTests
    echo "Finished auth tests"

    echo "Killing server"
    sudo kill -9 $(lsof -t -i:3000)

    codebuild-breakpoint

    echo "Deleting amplify app"
    export DEPLOYMENT_BUCKET="s3://$(jq -r '.providers.awscloudformation.DeploymentBucketName' amplify/backend/amplify-meta.json)"
    chmod +x ../amplify-cli/codebuild_specs/sh-files/delete_auth.sh
    expect ../amplify-cli/codebuild_specs/exp-files/delete_auth.exp
    aws s3 rb "$DEPLOYMENT_BUCKET" --force

    # echo "Cloning api test package"
    # cd .. && pwd
    # git clone $AUTH_CLONE_URL
    # cd aws-amplify-cypress-auth && pwd
    # yarn --cache-folder ~/.cache/yarn
    # yarn add cypress@6.8.0 --save
}
