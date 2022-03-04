set -x
# configure upstream remote branch
REMOTE_NAME=upstream
git remote add $REMOTE_NAME git@github.com:aws-amplify/amplify-cli.git

BASE_BRANCH=master

# try to determine the branch that the PR is diffed off of, defaulting to master
if [ -n ${CIRCLE_PR_NUMBER:-} ]; then
  echo "Fetching base branch for PR $CIRCLE_PR_NUMBER"
  BASE_BRANCH=$(curl -fsSL https://api.github.com/repos/aws-amplify/amplify-cli/pulls/$CIRCLE_PR_NUMBER | jq -r '.base.ref')
else
  echo "No PR number found. Defaulting to upstream/master as the comparison branch for linting"
fi

# fetch remote
yes 'yes' | git fetch $REMOTE_NAME $BASE_BRANCH

# create new branch that tracks upstream
git branch trackingupstream $REMOTE_NAME/$BASE_BRANCH

# get the files that have changed since diverging from the remote, filter only code files, filter removed files, then pass to eslint
# git diff --name-only HEAD $(git merge-base --fork-point $REMOTE_NAME/$BASE_BRANCH) | grep -E '\.(js|jsx|ts|tsx)$' | xargs find 2> /dev/null | xargs yarn eslint
set +x
