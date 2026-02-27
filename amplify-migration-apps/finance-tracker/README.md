# Finance Tracker (Amplify Gen1)

A personal finance tracking application built with Amplify Gen1, featuring authentication,
GraphQL API, Lambda functions, S3 storage, DynamoDB, and CDK custom resources.

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
? Enter a name for the project financetracker
The following configuration will be applied:

Project information
| Name: financetracker
| Environment: dev
| Default editor: Visual Studio Code
| App type: javascript
| Javascript framework: react
| Source Directory Path: src
| Distribution Directory Path: build
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

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html

? Please choose the profile you want to use default
```

## Add Categories

### Api

GraphQL API with schema containing:

- _Transaction_ model for tracking income and expenses with category, amount, date, and optional receipt URL.
- _Budget_ model for setting monthly spending limits per category.
- _FinancialSummary_ model for storing monthly income, expense, and balance totals.
- _calculateFinancialSummary_ query that computes financial metrics by invoking a Lambda function using the `@function` directive.
- _sendMonthlyReport_ and _sendBudgetAlert_ mutations that trigger notifications via a Lambda function using the `@function` directive.

Uses API key for default authorization.

```console
amplify add api
```

```console
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create. Select a setting to edit or continue Authorization modes: API key (default, expiration time: 7 days from now)
? Choose the default authorization type for the API API key
✔ Enter a description for the API key: · graphql
✔ After how many days from now the API key should expire (1-365): · 100
? Configure additional auth types? No
? Here is the GraphQL API that we will create. Select a setting to edit or continue Continue
? Choose a schema template: One-to-many relationship (e.g., "Blogs" with "Posts" and "Comments")
✔ Do you want to edit the schema now? (Y/n) · no
```

### Auth

Cognito-based authentication using email with default configuration.

```console
amplify add auth
```

```console
Using service: Cognito, provided by: awscloudformation
 The current configured provider is Amazon Cognito.
 Do you want to use the default authentication and security configuration? Default configuration
 Warning: you will not be able to edit these selections.
 How do you want users to be able to sign in? Email
 Do you want to configure advanced settings? No, I am done.
```

### Storage

S3 bucket for storing receipt images and financial documents. Authenticated users have full access; guest users have read-only access.

```console
amplify add storage
```

```console
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
✔ Provide a friendly name for your resource that will be used to label this category in the project: · s3c787456e
✔ Provide bucket name: · financetracker1c469bed6bfe46528cbd48078b7b0c03
✔ Who should have access: · Auth and guest users
✔ What kind of access do you want for Authenticated users? · create/update, read, delete
✔ What kind of access do you want for Guest users? · read
✔ Do you want to add a Lambda Trigger for your S3 Bucket? (y/N) · no
```

### Function

Node.js Lambda function for computing financial summaries and sending budget notifications, with access to the CDK custom resource.

```console
amplify add function
```

```console
? Select which capability you want to add: Lambda function (serverless function)
? Provide an AWS Lambda function name: financetracker7f7c2ad7
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
? Select the categories you want this function to have access to. custom
? Custom has 2 resources in this project. Select the one you would like your Lambda to access customfinance
? Select the operations you want to permit on customfinance create, read, update, delete

⚠️ custom category does not support resource policies yet.

You can access the following resource attributes as environment variables from your Lambda function
        ENV
        REGION
? Do you want to invoke this function on a recurring schedule? No
? Do you want to enable Lambda layers for this function? No
? Do you want to configure environment variables for this function? No
? Do you want to configure secret values this function can access? No
✔ Choose the package manager that you want to use: · NPM
? Do you want to edit the local lambda function now? No
```

The CLI only handles basic resource access permissions. The custom IAM policies and environment variables need to be added by manually editing the function's config files.

**Edit in `./amplify/backend/function/financetracker7f7c2ad7/custom-policies.json`:**

```json
[
  {
    "Action": ["sns:Publish", "sns:ListTopics", "sns:CreateTopic", "sns:Subscribe"],
    "Resource": ["*"]
  },
  {
    "Action": ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem"],
    "Resource": [
      {
        "Fn::Sub": ["arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/Transaction-*", {}]
      }
    ]
  },
  {
    "Action": ["sts:GetCallerIdentity"],
    "Resource": ["*"]
  }
]
```

**Edit in `./amplify/backend/function/financetracker7f7c2ad7/financetracker7f7c2ad7-cloudformation-template.json`:**

In the `Environment.Variables` section of the `LambdaFunction` resource, add:

```json
"BUDGET_ALERT_TOPIC_ARN": {
  "Fn::ImportValue": {
    "Fn::Sub": "financetracker-BudgetAlertTopicArn-${env}"
  }
},
"MONTHLY_REPORT_TOPIC_ARN": {
  "Fn::ImportValue": {
    "Fn::Sub": "financetracker-MonthlyReportTopicArn-${env}"
  }
},
"API_FINANCETRACKER_TRANSACTIONTABLE_NAME": {
  "Fn::Sub": "Transaction-${apifinancetrackerGraphQLAPIIdOutput}-${env}"
}
```

**Edit in `./amplify/backend/function/financetracker7f7c2ad7/function-parameters.json`:**

```json
{
  "lambdaLayers": [],
  "dependsOn": [
    {
      "category": "custom",
      "resourceName": "customfinance",
      "attributes": ["BudgetAlertTopicArn", "MonthlyReportTopicArn"]
    }
  ]
}
```

### Custom

CDK custom resource for additional infrastructure.

```console
amplify add custom
```

```console
✔ How do you want to define this custom resource? · AWS CDK
✔ Provide a name for your custom resource · customfinance
✔ Do you want to edit the CDK stack now? (Y/n) · no
```

## Deploy Backend

```console
amplify push
```

```console
┌──────────┬──────────────────────────┬───────────┬───────────────────┐
│ Category │ Resource name            │ Operation │ Provider plugin   │
├──────────┼──────────────────────────┼───────────┼───────────────────┤
│ Auth     │ financetracker96b98779   │ Create    │ awscloudformation │
├──────────┼──────────────────────────┼───────────┼───────────────────┤
│ Api      │ financetracker           │ Create    │ awscloudformation │
├──────────┼──────────────────────────┼───────────┼───────────────────┤
│ Storage  │ s3c787456e               │ Create    │ awscloudformation │
├──────────┼──────────────────────────┼───────────┼───────────────────┤
│ Function │ financetracker7f7c2ad7   │ Create    │ awscloudformation │
├──────────┼──────────────────────────┼───────────┼───────────────────┤
│ Custom   │ customfinance            │ Create    │ awscloudformation │
└──────────┴──────────────────────────┴───────────┴───────────────────┘

✔ Are you sure you want to continue? (Y/n) · yes
```

## Publish Frontend

To publish the frontend, we leverage the Amplify hosting console. First push everything to the `main` branch:

```console
git add .
git commit -m "feat: gen1"
git push origin main
```

Next, accept all default values and follow the getting started wizard to connect your repo and branch. Wait for the deployment to finish successfully.

## Migrating to Gen2

> Based on https://github.com/aws-amplify/amplify-cli/blob/gen2-migration/GEN2_MIGRATION_GUIDE.md

First install the experimental CLI package that provides the new commands:

```console
npm install --no-save @aws-amplify/cli-internal-gen2-migration-experimental-alpha
```

Now run them:

```console
npx amplify gen2-migration lock
```

```console
git checkout -b gen2-main
npx amplify gen2-migration generate
```

```console
git add .
git commit -m "feat: migrate to gen2"
git push origin gen2-main
```

Now connect the `gen2-main` branch to the hosting service and wait for the deployment to finish successfully. Next, locate the root stack of the Gen2 branch:

```console
git checkout main
npx amplify gen2-migration refactor --to <gen2-stack-name>
```

Redeploy the gen2 environment to regenerate the outputs file and wait for the deployment to finish successfully.
