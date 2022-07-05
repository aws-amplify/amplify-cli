#!/bin/bash

git remote update

rc_tag="$1"
remote_name="$2"

if [[ $rc_tag == "" ]]; then
  echo "Please include the rc tag you wish to release as the first argument"
  exit 1
fi

if [[ $remote_name == "" ]]; then
  echo "Please include the remote name of 'aws-amplify/amplify-cli as the second argument"
  exit 1
fi

rc_sha="$(git rev-parse --short $rc_tag)"
branch_name="release_$rc_sha"

git checkout -b "$branch_name" "$rc_tag"
git push "$remote_name" "$branch_name:release"
