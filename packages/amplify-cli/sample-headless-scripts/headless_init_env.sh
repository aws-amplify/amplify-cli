#!/bin/bash
set -e
IFS='|'

AWSCLOUDFORMATIONCONFIG="{\
\"configLevel\":\"project\",\
\"useProfile\":true,\
\"profileName\":\"default\"\
}"
NOTIFICATIONSCONFIG="{\
\"Pinpoint\":{
\"SMS\":{
\"Enabled\":true\
},\
\"Email\":{
\"Enabled\":true,\
\"FromAddress\":\"xxx@amzon.com\",\
\"Identity\":\"identityArn\",\
\"RoleArn\":\"roleArn\"\
},\
\"APNS\":{
\"Enabled\":true,\
\"DefaultAuthenticationMethod\":\"Certificate\",\
\"P12FilePath\":\"p12filePath\",\
\"Password\":\"p12FilePasswordIfAny\"\
},\
\"FCM\":{
\"Enabled\":true,\
\"ApiKey\":\"fcmapikey\"\
}\
}\
}"
AMPLIFY="{\
\"envName\":\"mydevabc\"\
}"
PROVIDERS="{\
\"awscloudformation\":$AWSCLOUDFORMATIONCONFIG\
}"
CATEGORIES="{\
\"notifications\":$NOTIFICATIONSCONFIG\
}"

amplify init \
--amplify $AMPLIFY \
--providers $PROVIDERS \
--categories $CATEGORIES \
--yes
