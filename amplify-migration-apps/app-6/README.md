# Mood Board App (Amplify Gen1)

A visual board app for capturing ideas and inspiration. Each Board can hold multiple Mood Items, 
each of which has a title, image, and optional description. The app features a "Surprise Me" 
button that returns random emojis and tracks clicks via Kinesis analytics.

- Board and MoodItem models use public auth (API key) - anyone can create/read/update/delete.
- Authenticated users can invoke the getRandomEmoji Lambda and read Kinesis events.
- Kinesis analytics tracks "Surprise Me" button clicks with timestamps.

## Install Dependencies

```console
npm install
```

## Initialize Environment

```console
amplify init
```

```console
⚠️ For new projects, we recommend starting with AWS Amplify Gen 2, our new code-first developer experience. Get started at https://docs.amplify.aws/react/start/quickstart/
✔ Do you want to continue with Amplify Gen 1? (y/N) · yes
✔ Why would you like to use Amplify Gen 1? · Prefer not to answer
Note: It is recommended to run this command from the root of your app directory
? Enter a name for the project moodboard
The following configuration will be applied:

Project information
| Name: moodboard
| Environment: dev
| Default editor: Visual Studio Code
| App type: javascript
| Javascript framework: none
| Source Directory Path: src
| Distribution Directory Path: dist
| Build Command: npm run-script build
| Start Command: npm run-script start

? Initialize the project with the above configuration? No
? Enter a name for the environment main
? Choose your default editor: Visual Studio Code
✔ Choose the type of app that you're building · javascript
Please tell us about your project
? What javascript framework are you using react
? Source Directory Path:  src
? Distribution Directory Path: dist
? Build Command:  npm run-script build
? Start Command: npm run-script start
Using default provider  awscloudformation
? Select the authentication method you want to use: AWS profile
```

## Add Categories

### Auth

Cognito-based auth using email.

```console
amplify add auth
```

```console
 Do you want to use the default authentication and security configuration? Default configuration
 Warning: you will not be able to edit these selections. 
 How do you want users to be able to sign in? Email
 Do you want to configure advanced settings? No, I am done.
```

### Api

GraphQL API with schema containing:

- _Board_ model for organizing mood items.
- _MoodItem_ model with title, description, image, and board reference.
- _getRandomEmoji_ query that returns random emojis by invoking a Lambda function using the `@function` directive.
- _getKinesisEvents_ query that reads events from Kinesis stream using a Lambda function.

```console
amplify add api
```

```console
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create. Select a setting to edit or continue: Authorization modes: API key (default, expiration time: 7 days from now)
? Choose the default authorization type for the API: API key
? Enter a description for the API key: moodBoard API Key
? After how many days from now the API key should expire (1-365): 365
? Configure additional auth types? Yes
? Choose the additional authorization types you want to configure for the API: Amazon Cognito User Pool
? Here is the GraphQL API that we will create. Select a setting to edit or continue: Continue
? Choose a schema template: Blank Schema
✔ Do you want to edit the schema now? (Y/n) · no
```

### Storage

S3-based storage for images of the _MoodItem_ model. Authenticated users can perform all operations, 
unauthenticated users can only read.

```console
amplify add storage
```

```console
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
✔ Provide a friendly name for your resource that will be used to label this category in the project: · moodboardStorage
✔ Provide bucket name: · (accept default value)
✔ Who should have access: · Auth and guest users
✔ What kind of access do you want for Authenticated users? · create/update, read, delete
✔ What kind of access do you want for Guest users? · read
✔ Do you want to add a Lambda Trigger for your S3 Bucket? (y/N) · no
```

### Function (moodboardGetRandomEmoji)

Node.js Lambda function that generates random emojis.

```console
amplify add function
```

```console
? Select which capability you want to add: Lambda function (serverless function)
? Provide an AWS Lambda function name: moodboardGetRandomEmoji
? Choose the runtime that you want to use: NodeJS
? Choose the function template that you want to use: Hello World

✅ Available advanced settings:
- Resource access permissions
- Scheduled recurring invocation
- Lambda layers configuration
- Environment variables configuration
- Secret values configuration

? Do you want to configure advanced settings? No
? Do you want to edit the local lambda function now? No
```

### Analytics

Kinesis Data Stream for tracking "Surprise Me" button clicks.

```console
amplify add analytics
```

```console
? Select an Analytics provider: Amazon Kinesis Streams
? Enter a Stream name: moodboardKinesis
? Enter number of shards: 1
```

### Function (moodboardKinesisReader)

Node.js Lambda function that reads events from the Kinesis stream. Configured with read access to the analytics resource.

```console
amplify add function
```

```console
? Select which capability you want to add: Lambda function (serverless function)
? Provide an AWS Lambda function name: moodboardKinesisReader
? Choose the runtime that you want to use: NodeJS
? Choose the function template that you want to use: Hello World

✅ Available advanced settings:
- Resource access permissions
- Scheduled recurring invocation
- Lambda layers configuration
- Environment variables configuration
- Secret values configuration

? Do you want to configure advanced settings? Yes
? Do you want to access other resources in this project from your Lambda function? Yes
? Select the categories you want this function to have access to. analytics
? Select the operations you want to permit on moodboardKinesis read

You can access the following resource attributes as environment variables from your Lambda function
ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN
ENV
REGION

? Do you want to invoke this function on a recurring schedule? No
? Do you want to enable Lambda layers for this function? No
? Do you want to configure environment variables for this function? No
? Do you want to configure secret values this function can access? No
✔ Choose the package manager that you want to use: · NPM
? Do you want to edit the local lambda function now? No
```

## Configure

```console
npm run configure
```

## Deploy Backend

```console
amplify push
```

```console
┌───────────┬──────────────────────────┬───────────┬───────────────────┐
│ Category  │ Resource name            │ Operation │ Provider plugin   │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Auth      │ moodboarda84f1a8d        │ Create    │ awscloudformation │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Api       │ moodboard                │ Create    │ awscloudformation │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Storage   │ moodboardStorage         │ Create    │ awscloudformation │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Function  │ moodboardGetRandomEmoji  │ Create    │ awscloudformation │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Function  │ moodboardKinesisReader   │ Create    │ awscloudformation │
├───────────┼──────────────────────────┼───────────┼───────────────────┤
│ Analytics │ moodboardKinesis         │ Create    │ awscloudformation │
└───────────┴──────────────────────────┴───────────┴───────────────────┘

✔ Are you sure you want to continue? (Y/n) · yes
? Do you want to generate code for your newly created GraphQL API Yes
? Choose the code generation language target: typescript
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.ts
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions: Yes
? Enter maximum statement depth: 2
? Enter the file name for the generated code: src/API.ts
```

## Publish Frontend

To publish the frontend, leverage the Amplify hosting console. First push everything to the `main` branch:

```console
git add .
git commit -m "feat: gen1"
git push origin main
```

Next, accept all the default values and follow the getting started wizard to connect your repo and branch. Wait for the deployment to finish successfully.

![](./images/hosting-get-started.png)
![](./images/add-main-branch.png)
![](./images/deploying-main-branch.png)

Wait for the deployment to finish successfully.

## Migrating to Gen2

First install the experimental amplify CLI package that provides the migration commands.

```console
npm install @aws-amplify/cli-internal-gen2-migration-experimental-alpha
```

Now run them:

```console
npx amplify gen2-migration lock
```

```console
git checkout -b gen2-main
npx amplify gen2-migration generate
```
**Edit in `./amplify/data/resource.ts`:**

```diff
- branchName: "main"
+ branchName: "gen2-main"
```

**Edit in `./amplify/function/moodboardRandomEmojiGenerator/index.js`**

```diff
- exports.handler = async (event) => {
+ export async function handler(event) {
```

**Edit in `./amplify/function/moodboardKinesisReader/index.js`**

```diff
- exports.handler = async (event) => {
+ export async function handler(event) {
```

**Edit in `./amplify/function/moodboardKinesisReader/resource.ts`**

```diff
- environment: { ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN: "arn:aws:kinesis:us-east-1:014148916658:stream/moodboardKinesis-main", ENV: `${branchName}`, REGION: "us-east-1" },
+ environment: { ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN: "arn:aws:kinesis:us-east-1:014148916658:stream/moodboardKinesis-gen2-main", ENV: `${branchName}`, REGION: "us-east-1" },
```

**Edit in `./src/main.tsx`:**

```diff
- import amplifyconfig from './amplifyconfiguration.json';
+ import amplifyconfig from '../amplify_outputs.json';
```

**Edit in `./src/components/SurpriseMeButton.tsx`:**

```diff
- const STREAM_NAME = 'moodboardKinesis-main';
+ const STREAM_NAME = 'moodboardKinesis-gen2-main';
```

**Edit in `./amplify/backend.ts`:**

```diff
- import { Duration } from "aws-cdk-lib";
+ import { Duration, aws_iam } from "aws-cdk-lib";
```

```diff
+ backend.moodboardKinesisReader.resources.lambda.addToRolePolicy(
+     new aws_iam.PolicyStatement({
+         actions: [
+             "kinesis:ListShards",
+             "kinesis:GetShardIterator",
+             "kinesis:GetRecords",
+             "kinesis:DescribeStream"
+         ],
+         resources: [analytics.kinesisStreamArn]
+     })
+ );
```

```diff
+ backend.moodBoardKinesisReader.addEnvironment("ANALYTICS_MOODBOARDDEMOKINESIS_KINESISSTREAMARN",analytics.kinesisStreamArn)
```

```console
git add .
git commit -m "feat: migrate to gen2"
git push origin gen2-main
```

Now connect the `gen2-main` branch to the hosting service:

![](./images/add-gen2-main-branch.png)
![](./images/deploying-gen2-main-branch.png)

Wait for the deployment to finish successfully. Next, locate the root stack of the Gen2 branch:

![](./images/find-gen2-stack.png)

```console
git checkout main
npx amplify gen2-migration refactor --to <gen2-stack-name>
```

```console
git checkout gen2-main
```

**Edit in `./amplify/analytics/resource.ts`:**

```diff
- //(analytics.node.findChild('KinesisStream') as CfnStream).name = "..."
+ (analytics.node.findChild('KinesisStream') as CfnStream).name = "..."
```
**Edit in `./amplify/backend.ts`:**

```diff
- // s3Bucket.bucketName = '...';
+ s3Bucket.bucketName = '...';
```
**Edit in `./src/components/SurpriseMeButton.tsx`:**

```diff
- const STREAM_NAME = 'moodboardKinesis-gen2-main';
+ const STREAM_NAME = 'moodboardKinesis-main';
```
**Edit in `./amplify/function/moodboardKinesisReader/resource.ts`**

```diff
- environment: { ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN: "arn:aws:kinesis:us-east-1:014148916658:stream/moodboardKinesis-gen2-main", ENV: `${branchName}`, REGION: "us-east-1" },
+ environment: { ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN: "arn:aws:kinesis:us-east-1:014148916658:stream/moodboardKinesis-main", ENV: `${branchName}`, REGION: "us-east-1" },
```

```console
git add .
git commit -m "chore: post refactor"
git push origin gen2-main
```

Wait for the deployment to finish successfully.
