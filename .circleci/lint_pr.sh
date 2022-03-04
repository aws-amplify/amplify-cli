# get the name of the remote repo (probably "origin")
REMOTE_NAME=$(git remote -v | grep aws-amplify/amplify-cli | head -n1 | awk '{print $1;}')
# CCI doesn't have an env var that exposes the base branch. Hardcoding for now
BASE_BRANCH=master
# get the files that have changed since diverging from the remote, filter only code files, filter removed files, then pass to eslint
git diff --name-only HEAD $(git merge-base --fork-point $REMOTE_NAME/$BASE_BRANCH) | grep -E '\.(js|jsx|ts|tsx)$' | xargs find 2> /dev/null | xargs yarn eslint
