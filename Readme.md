AWS Amplify CLI:-

AWS యాంప్లిఫై CLI అనేది మొబైల్ మరియు వెబ్ అప్లికేషన్ డెవలప్‌మెంట్‌ను సులభతరం చేయడానికి బలమైన ఫీచర్ సెట్‌ను కలిగి ఉన్న టూల్‌చెయిన్. CLI మీరు మీ ఖాతాలో అమలు చేయడానికి ముందు స్థానికంగా కాన్ఫిగరేషన్‌లను జోడించడానికి లేదా సవరించడానికి మిమ్మల్ని అనుమతించడానికి AWS క్లౌడ్‌ఫార్మేషన్ మరియు నెస్టెడ్ స్టాక్‌లను ఉపయోగిస్తుంది.

Install the CLI
Commands Summary
Tutorials
Contributing
Start building your app
Changelog

Install the CLI
Node.js® వెర్షన్ 18 లేదా తదుపరిది అవసరం
యాంప్లిఫై CLIని ఈ క్రింది విధంగా ఇన్‌స్టాల్ చేసి కాన్ఫిగర్ చేయండి:

$ npm install -g @aws-amplify/cli
$ amplify configure

గమనిక: CLIని ఇన్‌స్టాల్ చేస్తున్నప్పుడు మీ సిస్టమ్‌లో మీకు అనుమతి సమస్యలు ఉంటే, దయచేసి కింది ఆదేశాన్ని ప్రయత్నించండి:
$ sudo npm install -g @aws-amplify/cli --unsafe-perm=true
$ amplify configure

Commands Summary
యాంప్లిఫై CLI కింది పట్టికలో చూపిన ఆదేశాలకు మద్దతు ఇస్తుంది.
Command	Description
amplify configure	Configures the AWS access credentials, AWS Region and sets up a new AWS User Profile
amplify init	Initializes a new project, sets up deployment resources in the cloud and prepares your project for Amplify.
amplify configure project	Updates configuration settings used to setup the project during the init step.
amplify add <category>	Adds cloud features to your app.
amplify update <category>	Updates existing cloud features in your app.
amplify push [--no-gql-override]	Provisions cloud resources with the latest local developments. The 'no-gql-override' flag does not automatically compile your annotated GraphQL schema and will override your local AppSync resolvers and templates.
amplify pull	Fetch upstream backend environment definition changes from the cloud and updates the local environment to match that definition.
amplify publish	Runs amplify push, publishes a static assets to Amazon S3 and Amazon CloudFront (*hosting category is required).
amplify status [ <category>...]	Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete).
amplify status -v [ <category>...]	Verbose mode - Shows the detailed verbose diff between local and deployed resources, including cloudformation-diff
amplify serve	Runs amplify push, and then executes the project's start command to test run the client-side application.
amplify delete	Deletes resources tied to the project.
amplify help | amplify <category> help	Displays help for the core CLI.
amplify codegen add | generate	Performs generation of strongly typed objects using a GraphQL schema.
amplify env add | list | remove | get | pull | import | checkout	See the multienv docs.

Category specific commands:
auth (Amazon Cognito)
storage (Amazon S3 & Amazon DynamoDB)
function (AWS Lambda)
api (AWS AppSync & Amazon API Gateway)
analytics (Amazon Pinpoint)
hosting (Amazon S3 and Amazon CloudFront distribution)
notifications (Amazon Pinpoint)
interactions (Amazon Lex)
predictions (Amazon Rekognition, Amazon Textract, Amazon Translate, Amazon Polly, Amazon Transcribe, Amazon Comprehend, and Amazon SageMaker)
Tutorials
Getting Started guide
GraphQL transform tutorial
Native development with Amplify CLI and AWS AppSync

Developing
మీ స్థానిక అభివృద్ధి వాతావరణాన్ని సెటప్ చేయడానికి, స్థానిక పర్యావరణ సెటప్‌కి వెళ్లండి.

మీ వర్గాన్ని పరీక్షించడానికి, ఈ క్రింది వాటిని చేయండి:
cd <your-test-front-end-project>
amplify-dev init
amplify-dev <your-category> <subcommand>

కోడ్‌ని నెట్టడానికి లేదా పుల్ అభ్యర్థనను పంపడానికి ముందు, ఈ క్రింది వాటిని చేయండి:

కమాండ్ లైన్ వద్ద, టాప్-లెవల్ డైరెక్టరీలో నూలు లింట్‌ను అమలు చేయండి. ఇది మా ప్యాకేజీలన్నింటిలో లింట్ ఎర్రర్‌లను తనిఖీ చేయడానికి ఎస్లింట్‌ను ప్రేరేపిస్తుంది.
మీరు కొన్ని మెత్తటి లోపాలను కనుగొనడానికి నూలు మెత్తని ఉపయోగించవచ్చు. వాటిని పరిష్కరించడానికి ప్రయత్నించడానికి, లోపాలు ఉన్న ప్యాకేజీకి వెళ్లి, నూలు లింట్-ఫిక్స్‌ని అమలు చేయండి
ఏవైనా మిగిలిన లింట్ లోపాలు ఉంటే, వాటిని మాన్యువల్‌గా పరిష్కరించండి. మీ కోడ్‌ను లింటింగ్ చేయడం అనేది మంచి కోడ్ నాణ్యతను నిర్ధారించే ఒక ఉత్తమ అభ్యాసం కాబట్టి మీరు ఈ దశను దాటవేయకుండా ఉండటం ముఖ్యం.

Contributing
సంఘం నుండి ఏవైనా సహకారాలు అందించినందుకు మేము కృతజ్ఞులం. మా సహకార మార్గదర్శకాలను చూడండి.



