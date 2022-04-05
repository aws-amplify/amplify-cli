set -xeo pipefail
# extract the PR number from the PR link
PR_NUM=${CIRCLE_PULL_REQUEST##*/}

if [ -z "$PR_NUM" ]; then
  echo "Could not determine PR number. Cannot determine fork point for linting. Skipping linting."
  exit
fi

# get PR file list, filter out removed files, filter only JS/TS files, then pass to the linter
curl -fsSL https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PR_REPONAME/pulls/$PR_NUM/files | jq -r '.[] | select(.status!="removed") | .filename' | grep -E '\.(js|jsx|ts|tsx)$' || true | xargs yarn eslint
set +x
