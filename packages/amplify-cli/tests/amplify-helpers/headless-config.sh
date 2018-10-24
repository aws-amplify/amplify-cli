#!/bin/bash
set -e
PROJECTNAME=\"headlessProjectName\"
EDITOR=\"code\"
FRONTEND=\"android\"
PROVIDERS="[\"awscloudformation\"]"
AMPLIFY="{\
\"projectName\":$PROJECTNAME,\
\"defaultEditor\":$EDITOR,\
\"providers\":$PROVIDERS,\
\"frontend\":$FRONTEND\
}"
amplify configure project \
--amplify $AMPLIFY \
-y