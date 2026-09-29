#!/bin/bash

source ./scripts/cloud-cli-utils.sh

# Function to convert S3 ARN to S3 URI
function convertArnToUri {
  local arn="$1"

  # Remove "arn:aws:s3:::" from the beginning of the ARN
  local stripped_arn="${arn#arn:aws:s3:::}"

  # Extract the bucket name and object key
  local bucket_name="${stripped_arn%%/*}"
  local object_key="${stripped_arn#*/}"

  # Create the S3 URI
  local s3_uri="s3://$bucket_name/$object_key"

  echo "$s3_uri"
}

function downloadS3Artifact {
  # Get temporary access for the account
  E2E_ROLE_NAME=CodebuildE2E
  E2E_PROFILE_NAME=AmplifyCLIE2EProd
  authenticate $E2E_ACCOUNT_PROD $E2E_ROLE_NAME "$E2E_PROFILE_NAME"
  echo "Fetching artifact location from build"
  s3_arn=$(aws codebuild batch-get-builds --profile="$E2E_PROFILE_NAME" --ids "$1" --region us-east-1 --query 'builds[0].artifacts.location')
  # Have to remove double quote for arn
  s3_object_uri=$(convertArnToUri ${s3_arn//\"/})
  echo $s3_object_uri
  echo "Downloading objects from S3 bucket..."
  aws s3 cp $s3_object_uri $2 --recursive --profile="$E2E_PROFILE_NAME"
  echo "Download complete. Files are saved in: $2"
}

function playTestArtifact {
  # Check if an S3 object URI is provided
  if [ $# -eq 0 ]; then
    echo "Provide the code build id: $0 <code_build_id>"
    exit 1
  fi

  local code_build_id=$1
  local temp_dir=$(mktemp -d) # Create a temporary directory

  trap "cleanup $temp_dir" SIGINT SIGTERM # Register cleanup function to handle Ctrl+C

  echo "Starting test artifact playback..."
  downloadS3Artifact "$code_build_id" "$temp_dir"

  
  local subfolders=("$temp_dir"/*/)
  # Check if glob expansion actually found directories
  if [ ${#subfolders[@]} -eq 1 ] && [ -d "${subfolders[0]}" ]; then
    cd "${subfolders[0]}" || exit 1
  else
    cd "$temp_dir" || exit 1
  fi

  # Spin up a local HTTP server
  echo "Starting local HTTP server from directory $(pwd)..."
  npx http-server -p 0

  cleanup "$temp_dir"
}

function cleanup {
  echo "Cleaning up and deleting the temporary directory..."
  rm -rf "$1"
  echo "Temporary directory deleted. Exiting script."
}

playTestArtifact "$@"
