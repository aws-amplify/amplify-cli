#!/bin/bash
set -e
IFS='|'

AUTHCONFIG="{\
\"facebookAppId\":\"fbid1\",\
\"googleClientId\":\"goog\",\
\"amazonAppId\":\"amzn1\"\
}"
AWSCLOUDFORMATIONCONFIG="{\
\"configLevel\":\"project\",\
\"useProfile\":true,\
\"profileName\":\"default\"\
}"

AMPLIFY="{\
\"envName\":\"dev8\"\
}"
PROVIDERS="{\
\"awscloudformation\":$AWSCLOUDFORMATIONCONFIG\
}"
CATEGORIES="{\
\"auth\":$AUTHCONFIG\
}"

amplify init \
--amplify $AMPLIFY \
--providers $PROVIDERS \
--categories $CATEGORIES \
--yes