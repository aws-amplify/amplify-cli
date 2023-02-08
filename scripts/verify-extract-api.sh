#!/bin/bash

changed_api_extracts=$(git status | grep -F API.md | wc -l)

if [[ changed_api_extracts -gt 0 ]]; then
  echo "Fail! Detected api change. Please run 'yarn extract-api' and add API.md file changes to the change set."
  exit 1;
else
  echo "Success! No drift detected in API.md files."
fi
