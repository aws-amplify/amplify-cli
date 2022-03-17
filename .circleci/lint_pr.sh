set -xeo pipefail
# try to determine the branch that the PR is diffed off of, defaulting to master
if [ -z "$CIRCLE_PR_NUMBER" ]; then
  echo "No CIRCLE_PR_NUMBER found. Cannot determine fork point for linting. Skipping linting"
  exit
fi

# get PR file list, filter out removed files, filter only JS/TS files, then pass to the linter
curl -fsSL https://api.github.com/repos/$CIRCLE_PROJECT_USERNAME/$CIRCLE_PR_REPONAME/pulls/$CIRCLE_PR_NUMBER/files | jq -r '.[] | select(.status!="removed") | .filename' | grep -E '\.(js|jsx|ts|tsx)$' | xargs yarn eslint
set +x
