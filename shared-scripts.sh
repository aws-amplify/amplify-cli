function _setShell {
    echo "Setting Shell"
    yarn config set script-shell $(which bash)
}
function _buildLinux {
    _setShell()
    echo "Linux Build"
    yarn run production-build
    # copy [repo, .cache, and .ssh to s3]
    # aws s3 cp $CODEBUILD_SRC_DIR/repo s3://$CODEBUILD_BUCKET/$CODEBUILD_BATCH_BUILD_IDENTIFIER/repo
}
function _buildWindows {
    _setShell()
    echo "Windows Build"
    yarn run production-build
    # copy [repo, .cache, and .ssh to s3]
}
function _test {
    echo "Run Test"
    # aws s3 cp s3://$CODEBUILD_BUCKET/$CODEBUILD_BATCH_BUILD_IDENTIFIER/repo $CODEBUILD_SRC_DIR/repo
    # download [repo, .cache from s3]
    yarn test-ci
    echo "collecting coverage"
    yarn coverage
}
function _validateCDKVersion {
    echo "Validate CDK Version"
    # download [repo, .cache from s3]
    yarn ts-node .circleci/validate_cdk_version.ts
}
function _lint {
    # download [repo, .cache from s3]
    echo "Linting"
    yarn lint-check
    yarn lint-check-package-json
    yarn prettier-check
}
function _verifyAPIExtract {
    # download [repo, .cache from s3]
    echo "Verify API Extract"
    yarn verify-api-extract
}
function _verifyYarnLock {
    # download [repo, .cache from s3]
    echo "Verify Yarn Lock"
    yarn verify-yarn-lock
}
function _verifyVersionsMatch {
    # download [repo, .cache, verdaccio-cache from s3]
    echo "Verify Versions Match"
    source .circleci/local_publish_helpers.sh
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    checkPackageVersionsInLocalNpmRegistry
}
function _mockE2ETests {
    # download [repo, .cache from s3]
    source .circleci/local_publish_helpers.sh
    cd packages/amplify-util-mock/
    yarn e2e
}
function _publishToLocalRegistry {
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
function _uploadPkgBinaries {
    # download [repo, pkg-binaries, from s3]
    echo "Consolidate binaries cache and upload"
    source .circleci/local_publish_helpers.sh
    uploadPkgCli
    # copy [repo/out to s3]
}
function _buildBinaries {
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
function _runE2ETestsLinux {
    source .circleci/local_publish_helpers.sh
    source $BASH_ENV
    startLocalRegistry "$(pwd)/.circleci/verdaccio.yaml"
    setNpmRegistryUrlToLocal
    changeNpmGlobalPath
    amplify version
    cd packages/amplify-e2e-tests
    retry runE2eTest
}
