#!/bin/bash

custom_registry_url=http://localhost:4873
default_verdaccio_package=verdaccio@5.1.2

function startLocalRegistry {
    # Start local registry
    tmp_registry_log="$(mktemp)"
    echo "Registry output file: $tmp_registry_log"
    (cd && nohup npx ${VERDACCIO_PACKAGE:-$default_verdaccio_package} -c $1 &>$tmp_registry_log &)
    # Wait for Verdaccio to boot
    attempts=0
    until grep -q 'http address' $tmp_registry_log
    do
      attempts=$((attempts+1))
      echo "Waiting for Verdaccio, attempt $attempts"
      sleep 1

      if (( attempts > 60 )); then
        echo "Verdaccio didn't start";
        exit 1
      fi
    done
}

function uploadPkgCliCodeBuild {
    # fail and exit if any command fails
    set -e

    cd out/
    export version=$(./amplify-pkg-linux-x64 --version)

    # validate that version is uploaded in right build
    if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      if [[ "$PROJECT_NAME" != "Release" ]]; then
        echo "Invalid project name $PROJECT_NAME for $version release."
        exit 1
      fi
    elif [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\. ]]; then
      if [[ "$PROJECT_NAME" != "RC" ]]; then
        echo "Invalid project name $PROJECT_NAME for $version RC release."
        exit 1
      fi
    elif [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+-$ ]]; then
      echo "Version $version is missing a tag";
      exit 1
    fi

    # It's ok to re-upload binaries for the same build to make this step idempotent
    # Versioning is handled by cb-publish-step-1-set-versions script
    # Version conflicts are caught at cb-publish-step-2-verdaccio script
    aws s3 cp amplify-pkg-win-x64.tgz s3://$PKG_CLI_BUCKET_NAME/$(echo $version)/amplify-pkg-win-x64.tgz
    aws s3 cp amplify-pkg-macos-x64.tgz s3://$PKG_CLI_BUCKET_NAME/$(echo $version)/amplify-pkg-macos-x64.tgz
    aws s3 cp amplify-pkg-linux-arm64.tgz s3://$PKG_CLI_BUCKET_NAME/$(echo $version)/amplify-pkg-linux-arm64.tgz
    aws s3 cp amplify-pkg-linux-x64.tgz s3://$PKG_CLI_BUCKET_NAME/$(echo $version)/amplify-pkg-linux-x64.tgz

    cd ..
}

function generatePkgCli {
  cd pkg

  # install package depedencies
  cp ../yarn.lock ./
  yarn workspaces focus --production

  # Optimize package size
  find . \
    -name "*.d.ts" -or -name "*.js.map" -or -name "*.d.ts.map" -or \
    -iname "readme.md" -or -iname "changelog.md" -or -iname "history.md" \
    | xargs rm

  # Restore .d.ts files required by @aws-amplify/codegen-ui at runtime
  cp ../node_modules/typescript/lib/*.d.ts node_modules/typescript/lib/

  # replace DEV binary entry point with production one
  cp ../node_modules/@aws-amplify/cli-internal/bin/amplify.production.template node_modules/@aws-amplify/cli-internal/bin/amplify

  # Transpile code for packaging
  npx babel node_modules --extensions '.js,.jsx,.es6,.es,.ts' --copy-files --include-dotfiles -d ../build/node_modules

  # Include third party licenses
  cp ../Third_Party_Licenses.txt ../build/node_modules

  # Build pkg cli
  cp package.json ../build/node_modules/package.json

  if [[ "$@" =~ 'arm' ]]; then
    npx pkg --no-bytecode --public-packages "*" --public -t node18-linux-arm64 ../build/node_modules -o ../out/amplify-pkg-linux-arm64
    tar -czvf ../out/amplify-pkg-linux-arm64.tgz ../out/amplify-pkg-linux-arm64
  fi

  if [[ "$@" =~ 'linux' ]]; then
    npx pkg -t node18-linux-x64 ../build/node_modules -o ../out/amplify-pkg-linux-x64
    tar -czvf ../out/amplify-pkg-linux-x64.tgz ../out/amplify-pkg-linux-x64
  fi

  if [[ "$@" =~ 'macos' ]]; then
    npx pkg -t node18-macos-x64 ../build/node_modules -o ../out/amplify-pkg-macos-x64
    tar -czvf ../out/amplify-pkg-macos-x64.tgz ../out/amplify-pkg-macos-x64
  fi

  if [[ "$@" =~ 'win' ]]; then
    npx pkg -t node18-win-x64 ../build/node_modules -o ../out/amplify-pkg-win-x64.exe
    tar -czvf ../out/amplify-pkg-win-x64.tgz ../out/amplify-pkg-win-x64.exe
  fi

  cd ..
}

function verifyPkgCli {
    echo "Human readable sizes"
    du -h out/*
    echo "Sizes in bytes"
    wc -c out/*

    function verifySinglePkg {
      binary_name=$1
      compressed_binary_name=$2
      binary_threshold_in_bytes=$3

      # Compressed binary size is not deterministic enough to have stricter threshold.
      # I.e. it depends on how compression algorithm can compress bytecode and there are cases where compressed size
      # grows even if uncompressed size drops. We don't have control on bytecode and compression.
      # Therefore we check if compression gets past half of original size as sanity check.
      compressed_binary_threshold_in_bytes=$((binary_threshold_in_bytes/2))

      binary_size=$(wc -c out/$binary_name | awk '{print $1}')
      compressed_binary_size=$(wc -c out/$compressed_binary_name | awk '{print $1}')

      if (( binary_size > binary_threshold_in_bytes )); then
        echo "$binary_name size has grown over $binary_threshold_in_bytes bytes"
        exit 1
      fi

      if (( compressed_binary_size > compressed_binary_threshold_in_bytes )); then
        echo "$compressed_binary_name size has grown over $compressed_binary_threshold_in_bytes bytes"
        exit 1
      fi
    }

    verifySinglePkg "amplify-pkg-linux-x64" "amplify-pkg-linux-x64.tgz" $((865 * 1024 * 1024))
    verifySinglePkg "amplify-pkg-macos-x64" "amplify-pkg-macos-x64.tgz" $((870 * 1024 * 1024))
    verifySinglePkg "amplify-pkg-win-x64.exe" "amplify-pkg-win-x64.tgz" $((860 * 1024 * 1024))
    verifySinglePkg "amplify-pkg-linux-arm64" "amplify-pkg-linux-arm64.tgz" $((710 * 1024 * 1024))
}

function unsetNpmRegistryUrl {
    # Restore the original NPM and Yarn registry URLs
    npm set registry "https://registry.npmjs.org/"
    yarn config set npmRegistryServer "https://registry.npmjs.org/"
}

function unsetSudoNpmRegistryUrl {
    # Restore the original NPM and Yarn registry URLs
    sudo npm set registry "https://registry.npmjs.org/"
    sudo yarn config set npmRegistryServer "https://registry.npmjs.org/"
}

function changeNpmGlobalPath {
    mkdir -p ~/.npm-global/{bin,lib}
    npm config set prefix '~/.npm-global'
    export PATH=~/.npm-global/bin:$PATH
}

function changeSudoNpmGlobalPath {
    mkdir -p ~/.npm-global-sudo
    npm config set prefix '~/.npm-global-sudo'
    export PATH=~/.npm-global/bin:$PATH
}

function setNpmRegistryUrlToLocal {
    # Set registry to local registry
    npm set registry "$custom_registry_url"
    yarn config set npmRegistryServer "$custom_registry_url"
}

function setSudoNpmRegistryUrlToLocal {
    # Set registry to local registry
    sudo npm set registry "$custom_registry_url"
    sudo yarn config set npmRegistryServer "$custom_registry_url"
}

function useChildAccountCredentials {
    if [[ ! -z "$USE_PARENT_ACCOUNT" ]]; then
        echo "Using parent account credentials"
        return
    fi
    export AWS_PAGER=""
    parent_acct=$(aws sts get-caller-identity | jq -cr '.Account')
    child_accts=$(aws organizations list-accounts | jq -c "[.Accounts[].Id | select(. != \"$parent_acct\")]")
    org_size=$(echo $child_accts | jq 'length')
    pick_acct=$(echo $child_accts | jq -cr ".[$RANDOM % $org_size]")
    session_id=$((1 + $RANDOM % 10000))
    if [[ -z "$pick_acct" || -z "$session_id" ]]; then
        echo "Unable to find a child account. Falling back to parent AWS account"
        return
    fi
    creds=$(aws sts assume-role --role-arn arn:aws:iam::${pick_acct}:role/OrganizationAccountAccessRole --role-session-name testSession${session_id} --duration-seconds 3600)
    if [ -z $(echo $creds | jq -c -r '.AssumedRoleUser.Arn') ]; then
        echo "Unable to assume child account role. Falling back to parent AWS account"
        return
    fi
    echo "Using account credentials for $(echo $creds | jq -c -r '.AssumedRoleUser.Arn')"
    export AWS_ACCESS_KEY_ID=$(echo $creds | jq -c -r ".Credentials.AccessKeyId")
    export AWS_SECRET_ACCESS_KEY=$(echo $creds | jq -c -r ".Credentials.SecretAccessKey")
    export AWS_SESSION_TOKEN=$(echo $creds | jq -c -r ".Credentials.SessionToken")
}

function retry {
    MAX_ATTEMPTS=2
    SLEEP_DURATION=5
    FIRST_RUN=true
    n=0
    FAILED_TEST_REGEX_FILE="./amplify-e2e-reports/amplify-e2e-failed-test.txt"
    rm -f $FAILED_TEST_REGEX_FILE
    until [ $n -ge $MAX_ATTEMPTS ]
    do
        echo "Attempting $@ with max retries $MAX_ATTEMPTS"
        setAwsAccountCredentials
        "$@" && break
        n=$[$n+1]
        FIRST_RUN=false
        echo "Attempt $n completed."
        sleep $SLEEP_DURATION
    done
    if [ $n -ge $MAX_ATTEMPTS ]; then
        echo "failed: ${@}" >&2
        exit 1
    fi

    resetAwsAccountCredentials
    TEST_SUITE=${TEST_SUITE:-"TestSuiteNotSet"}
    # if a test takes a long time to complete, the token may expire before reaching this call, but we should still allow the test to pass
    aws cloudwatch put-metric-data --metric-name FlakyE2ETests --namespace amplify-cli-e2e-tests --unit Count --value $n --dimensions testFile=$TEST_SUITE || true
    echo "Attempt $n succeeded."
    exit 0 # don't fail the step if putting the metric fails
}

function resetAwsAccountCredentials {
    if [ -z "$AWS_ACCESS_KEY_ID_ORIG" ]; then
        echo "AWS Access Key environment variable is already set"
    else
        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID_ORIG
    fi
    if [ -z "$AWS_SECRET_ACCESS_KEY_ORIG" ]; then
        echo "AWS Secret Access Key environment variable is already set"
    else
        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY_ORIG
    fi
    if [ -z "$AWS_SESSION_TOKEN_ORIG" ]; then
        echo "AWS Session Token environment variable is already set"
    else
        export AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN_ORIG
    fi
}

function setAwsAccountCredentials {
    resetAwsAccountCredentials
    export AWS_ACCESS_KEY_ID_ORIG=$AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY_ORIG=$AWS_SECRET_ACCESS_KEY
    export AWS_SESSION_TOKEN_ORIG=$AWS_SESSION_TOKEN
    # introduce a delay of up to 1 minute to allow for more even spread aws list-accounts calls due to throttling
    sleep $[ ( $RANDOM % 60 )  + 1 ]s
    if [[ "$OSTYPE" == "msys" ]]; then
        # windows provided by circleci has this OSTYPE
        useChildAccountCredentials
    else
        echo "OSTYPE is $OSTYPE"
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip -o awscliv2.zip >/dev/null
        export PATH=$PATH:$(pwd)/aws/dist
        useChildAccountCredentials
    fi
}

function runE2eTestCb {
    _setupCoverage
    FAILED_TEST_REGEX_FILE="./amplify-e2e-reports/amplify-e2e-failed-test.txt"

    if [ -f  $FAILED_TEST_REGEX_FILE ]; then
        # read the content of failed tests
        failedTests=$(<$FAILED_TEST_REGEX_FILE)
        if [[ ! -z "$DISABLE_COVERAGE" ]]; then
            echo Running WITHOUT coverage
            yarn e2e --forceExit --no-cache --maxWorkers=4 $TEST_SUITE -t "$failedTests"
        else
            NODE_V8_COVERAGE=$E2E_TEST_COVERAGE_DIR yarn e2e --forceExit --no-cache --maxWorkers=4 $TEST_SUITE -t "$failedTests"
        fi
    else
        if [[ ! -z "$DISABLE_COVERAGE" ]]; then
            echo Running WITHOUT coverage
            yarn e2e --forceExit --no-cache --maxWorkers=4 $TEST_SUITE
        else
            NODE_V8_COVERAGE=$E2E_TEST_COVERAGE_DIR yarn e2e --forceExit --no-cache --maxWorkers=4 $TEST_SUITE
        fi
    fi
}

function _setupCoverage {
    _teardownCoverage
    echo "Setup Coverage ($E2E_TEST_COVERAGE_DIR)"
    if [ ! -d $E2E_TEST_COVERAGE_DIR ]
    then
        mkdir -p $E2E_TEST_COVERAGE_DIR
    fi
}

function _teardownCoverage {
    if [ -d $E2E_TEST_COVERAGE_DIR ]
    then
        echo "Teardown Coverage ($E2E_TEST_COVERAGE_DIR)"
        rm -r $E2E_TEST_COVERAGE_DIR
    fi
}

function checkPackageVersionsInLocalNpmRegistry {
    cli_internal_version=$(npm view @aws-amplify/cli-internal version)
    cli_version=$(npm view @aws-amplify/cli version)

    echo "@aws-amplify/cli-internal version: $cli_internal_version"
    echo "@aws-amplify/cli version: $cli_version"

    if [[ $cli_internal_version != $cli_version ]]; then
        echo "Versions did not match."
        echo "Manual fix: add a proper conventional commit that touches the amplify-cli-npm package to correct its version bump. For example https://github.com/aws-amplify/amplify-cli/pull/13759/commits/15dcd96feae925ff26ca51abfb4a0477890af745"
        exit 1
    else
        echo "Versions matched."
    fi
}
