#!/bin/bash

custom_registry_url=http://localhost:4873
default_verdaccio_package=verdaccio@5.1.2

function startLocalRegistry {
  # Start local registry
  tmp_registry_log=$(mktemp)
  echo "Registry output file: $tmp_registry_log"
  (cd && nohup npx ${VERDACCIO_PACKAGE:-$default_verdaccio_package} -c $1 &>$tmp_registry_log &)
  # Wait for Verdaccio to boot
  grep -q 'http address' <(tail -f $tmp_registry_log)
}

function loginToLocalRegistry {
  # Login so we can publish packages
  (cd && npx npm-auth-to-token@1.0.0 -u user -p password -e user@example.com -r "$custom_registry_url")
}

function unsetNpmRegistryUrl {
  # Restore the original NPM and Yarn registry URLs
  npm set registry "https://registry.npmjs.org/"
  yarn config set registry "https://registry.npmjs.org/"
}

function unsetSudoNpmRegistryUrl {
  # Restore the original NPM and Yarn registry URLs
  sudo npm set registry "https://registry.npmjs.org/"
  sudo yarn config set registry "https://registry.npmjs.org/"
}

function changeNpmGlobalPath {
  mkdir -p ~/.npm-global
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
  yarn config set registry "$custom_registry_url"
}

function setSudoNpmRegistryUrlToLocal {
  # Set registry to local registry
  sudo npm set registry "$custom_registry_url"
  sudo yarn config set registry "$custom_registry_url"
}

function setAwsAccountCredentials {
  if [[ "$OSTYPE" == "win32" ]]; then
    echo "Using parent account credentials for OSTYPE $OSTYPE"
  elif [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Using parent account credentials for OSTYPE $OSTYPE"
  elif [[ "$OSTYPE" == "msys" ]]; then
    # windows provided by circleci has this OSTYPE
    if [ -z "$USE_PARENT_ACCOUNT" ]; then
      export AWS_PAGER=""
      export CREDS=$(aws sts assume-role --role-arn arn:aws:iam::$(aws organizations list-accounts | jq -c -r ".Accounts [$((1 + $RANDOM % 5))].Id"):role/OrganizationAccountAccessRole --role-session-name testSession$((1 + $RANDOM % 10000)) --duration-seconds 3600)
      if [ -z $(echo $CREDS | jq -c -r '.AssumedRoleUser.Arn') ]; then
        echo "Unable to assume child account role. Falling back to parent AWS account"
      else
        echo "Using account credentials for $(echo $CREDS | jq -c -r '.AssumedRoleUser.Arn')"
        export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -c -r ".Credentials.AccessKeyId")
        export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -c -r ".Credentials.SecretAccessKey")
        export AWS_SESSION_TOKEN=$(echo $CREDS | jq -c -r ".Credentials.SessionToken")
      fi
    else
      echo "Using parent account credentials."
    fi
  else
    echo "OSTYPE is $OSTYPE"
    if [ -z "$USE_PARENT_ACCOUNT" ]; then
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
      unzip -o awscliv2.zip >/dev/null
      export PATH=$PATH:$(pwd)/aws/dist
      export AWS_PAGER=""
      export CREDS=$(aws sts assume-role --role-arn arn:aws:iam::$(aws organizations list-accounts | jq -c -r ".Accounts [$((1 + $RANDOM % 5))].Id"):role/OrganizationAccountAccessRole --role-session-name testSession$((1 + $RANDOM % 10000)) --duration-seconds 3600)
      if [ -z $(echo $CREDS | jq -c -r '.AssumedRoleUser.Arn') ]; then
        echo "Unable to assume child account role. Falling back to parent AWS account"
      else
        echo "Using account credentials for $(echo $CREDS | jq -c -r '.AssumedRoleUser.Arn')"
        export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -c -r ".Credentials.AccessKeyId")
        export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -c -r ".Credentials.SecretAccessKey")
        export AWS_SESSION_TOKEN=$(echo $CREDS | jq -c -r ".Credentials.SessionToken")
      fi
    else
      echo "Using parent account credentials."
    fi
  fi
}
