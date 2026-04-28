#!/bin/bash


gs_output=$(git status)

echo git status output follows
echo $gs_output

gd_output=$(git diff)

echo git diff output follows
echo $gd_output

changed_api_extracts=$(gs_output | grep -F API.md | wc -l)

if [[ changed_api_extracts -gt 0 ]]; then
  echo "Fail! Detected api change. Please run 'yarn extract-api' and add API.md file changes to the change set."
  exit 1;
else
  echo "Success! No drift detected in API.md files."
fi
