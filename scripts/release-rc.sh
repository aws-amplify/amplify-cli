#!/bin/bash

git remote update

rc_sha="$1"
remote_name="$2"

if [[ $rc_tag == "" ]]; then
  echo "Please include the rc sha you wish to release as the first argument"
  exit 1
fi

if [[ $remote_name == "" ]]; then
  echo "Please include the remote name of 'aws-amplify/amplify-cli as the second argument"
  exit 1
fi

branch_name="release_rc/$rc_sha"

git checkout -b "$branch_name" "$rc_sha"
git push "$remote_name" "$branch_name"
