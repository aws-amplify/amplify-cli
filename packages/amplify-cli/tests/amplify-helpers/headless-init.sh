#!/bin/bash
set -e
PROJECTNAME=\"headlessProjectName\"
EDITOR=\"code\"
FRONTEND=\"react\"
PROVIDERS="[\"awscloudformation\"]"
AMPLIFY="{\
\"projectName\":$PROJECTNAME,\
\"defaultEditor\":$EDITOR,\
\"providers\":$PROVIDERS,\
\"frontend\":$FRONTEND\
}"
amplify init --amplify $AMPLIFY -y