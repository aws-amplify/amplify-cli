#!/bin/bash
set -e
IFS='|'
PROJECTNAME=\"headlessProjectName\"
EDITOR=\"code\"
FRONTEND=\"javascript\"
PROVIDERS="[\"awscloudformation\"]"
AMPLIFY="{\
\"projectName\":$PROJECTNAME,\
\"defaultEditor\":$EDITOR,\
\"providers\":$PROVIDERS,\
\"frontend\":$FRONTEND\
}"
REACTCONFIG="{\
\"SourceDir\":\"src\",\
\"DistributionDir\":\"build\",\
\"BuildCommand\":\"npm run-script build\",\
\"StartCommand\":\"npm run-script start\"\
}"
JAVASCRIPT="{\
\"framework\":\"react\",\
\"config\":$REACTCONFIG\
}"
AWSCLOUDFORMATIONPPROJECTCONFIG="{\
\"useProfile\":false,\
\"profileName\":\"default\",\
\"accessKeyId\":\"headlessaccesskeyid\",\
\"secretAccessKey\":\"headlesssecrectaccesskey\",\
\"region\":\"us-east-1\"\
}"
AWSCLOUDFORMATION="{\
\"configLevel\":\"project\",\
\"config\":$AWSCLOUDFORMATIONPPROJECTCONFIG\
}"
amplify configure project \
--amplify $AMPLIFY \
--javascript $JAVASCRIPT \
--awscloudformation $AWSCLOUDFORMATION