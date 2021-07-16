#!/bin/bash
set -e
IFS='|'
FRONTENDTYPE="$1"
PROFILE_NAME="$2"
AUTHCONFIG="{\
\"version\": 1,\
\"resourceName\": \"myTestAuth\",\
\"serviceConfiguration\": {\
\"serviceName\": \"Cognito\",\
\"userPoolConfiguration\": {\
\"signinMethod\": \"EMAIL\",\
\"requiredSignupAttributes\": [\"EMAIL\"]\
},\
\"includeIdentityPool\": false\
}\
}"
AWSCLOUDFORMATIONCONFIG="{\
\"configLevel\":\"project\",\
\"useProfile\":true,\
\"profileName\":\"$PROFILE_NAME\"\
}"
AMPLIFY="{\
\"envName\":\"dev\",\
\"projectName\": \"testproject\",\
\"defaultEditor\": \"vscode\"
}"
PROVIDERS="{\
\"awscloudformation\":$AWSCLOUDFORMATIONCONFIG\
}"
ANDROIDCONFIG="{\
\"ResDir\": \"app/src/main/res\"
}"
FRONTEND="{\
\"frontend\": \"$FRONTENDTYPE\",\
\"config\": $ANDROIDCONFIG
}"
EXIT_CODE=0
amplify init \
--amplify $AMPLIFY \
--providers $PROVIDERS \
--frontend $FRONTEND \
--yes
echo $AUTHCONFIG | amplify add auth --headless 
amplify push --yes
if [[ $FRONTENDTYPE == "android" ]]; then
    AMPLIFYCONFIGURATIONFILE="./app/src/main/res/raw/amplifyconfiguration.json"
    AWSCONFIGURATIONFILE="./app/src/main/res/raw/awsconfiguration.json"
fi
if [[ $FRONTENDTYPE == "ios" ]]; then
    AMPLIFYCONFIGURATIONFILE="./amplifyconfiguration.json"
    AWSCONFIGURATIONFILE="./awsconfiguration.json"
fi
grep -E 'PoolId|AppClientId|Region' $AMPLIFYCONFIGURATIONFILE
if (($(grep -Ec 'PoolId|AppClientId|Region' $AMPLIFYCONFIGURATIONFILE) == "3")); then
        echo "PoolID, AppClientId Region exists in amplifyconfiguration.json"
    else
        echo "drift in amplifyconfiguration.json detected"
        EXIT_CODE=1
fi
grep -E 'PoolId|AppClientId|Region' $AWSCONFIGURATIONFILE
if (($(grep -Ec 'PoolId|AppClientId|Region' $AWSCONFIGURATIONFILE) == "3")); then
        echo "PoolID, AppClientId & Region exists in awsconfiguration.json"
    else
        echo "drift in awsconfiguration.json detected"
        EXIT_CODE=1
fi
exit $EXIT_CODE
