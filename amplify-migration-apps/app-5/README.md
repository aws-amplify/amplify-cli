# Fitness Goal Tracker

A comprehensive fitness tracking application built with AWS Amplify Gen1, React, and TypeScript. Track your workout programs, exercises, and progress with photos while staying motivated with daily fitness quotes.

![Fitness Goal Tracker](https://img.shields.io/badge/Fitness-Goal%20Tracker-e85d04)
![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-orange)
![React](https://img.shields.io/badge/React-19.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## Features

### Workout Program Management
- Create and manage multiple workout programs
- Track program status: Active, Achieved, Paused, or Archived
- Customize program colors for visual organization
- Organize exercises within programs

### Exercise Tracking
- Add individual exercises with detailed descriptions
- Include sets, reps, and personal notes
- Upload progress photos to track your transformation
- Assign exercises to programs or keep them standalone

### Progress Photos
- Upload multiple photos per exercise
- View photos in an interactive gallery
- Download photos for your records
- Track visual progress over time

### Daily Motivation
- Get inspired with motivation quotes
- Lambda-powered quote generator

### Login Activity Tracking
- Automatic login logging via Cognito trigger
- View recent login history
- Stored securely in S3

### Dark Mode
- Comfortable viewing in any lighting
- Automatic theme persistence
- Fitness-themed color palette

### Authentication & Security
- Read-only mode for unauthenticated users
- Full CRUD access for authenticated users
- Owner-based permissions
- Secure AWS Cognito authentication

## Architecture

### Backend (AWS Amplify Gen1)
- **GraphQL API**: AppSync with DynamoDB
- **Authentication**: Amazon Cognito with Post Authentication trigger
- **Storage**: Amazon S3 for progress photos and login logs
- **Serverless Functions**: AWS Lambda for quote generation and auth logging
- **Hosting**: Amplify Console

### Frontend
- **Framework**: React 19.1 with TypeScript
- **Build Tool**: Vite
- **UI Components**: AWS Amplify UI React
- **State Management**: React Hooks
- **Styling**: Inline styles with theme support

## Prerequisites

- Node.js 25+ (stable)
- AWS Account with appropriate permissions
- AWS Amplify CLI

```bash
$ node -v
v25.2.1
```

[Amplify Gen1 Getting Started](https://docs.amplify.aws/gen1/react/start/getting-started/installation/)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Amplify

```bash
amplify init
```

Configuration:
- Select all default options except:
- **Distribution Directory Path**: `dist` (not `build`)
- Choose your AWS profile with Amplify permissions

```
? Initialize the project with the above configuration? No
? Enter a name for the environment dev
? Choose your default editor: Visual Studio Code
✔ Choose the type of app that you're building · javascript
? What javascript framework are you using react
? Source Directory Path: src
? Distribution Directory Path: dist
? Build Command: npm run-script build
? Start Command: npm run-script start
Using default provider awscloudformation
? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use default
```

### 3. Add API

```bash
amplify add api
```

Settings:
- Choose: **GraphQL**
- Name: `fitnessappapi`
- Authorization: **API key** (default, 7 days expiration)
- Conflict detection: **Disabled**
- Template: **Single object with fields**.  

When prompted to edit the schema:     
- For stress testing: Copy the contents of stress-test-schema.graphql-copy to `schema.graphql`    
- For normal use: Copy the following code to schema.graphql:  

```graphql

# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: https://docs.amplify.aws/cli/graphql/authorization-rules
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!

type QuoteResponse {
  message: String! @auth(rules: [{ allow: public }])
  quote: String! @auth(rules: [{ allow: public }])
  author: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
  totalQuotes: Int! @auth(rules: [{ allow: public }])
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator")  @auth(rules: [{ allow: public }])
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  ARCHIVED
}

type Project @model @auth(rules: [
  { allow: public, operations: [read] },
  { allow: owner, operations: [create, read, update, delete] }
]) {
  id: ID!
  title: String!
  description: String
  status: ProjectStatus!
  deadline: AWSDateTime
  color: String
  todos: [Todo] @hasMany
}

type Todo @model @auth(rules: [
  { allow: public, operations: [read] },
  { allow: owner, operations: [create, read, update, delete] }
]) {
  id: ID!
  name: String!
  description: String
  images: [String]
  projectID: ID
}

```

The GraphQL schema defines:
- **Project** model: Workout programs with status tracking
- **Todo** model: Individual exercises with image support
- **QuoteResponse**: Motivational quotes from Lambda

### 4. Add Authentication

```bash
amplify add auth
```

```
? Do you want to use the default authentication and security configuration? Manual configuration
? Select the authentication/authorization services that you want to use: User Sign-Up, Sign-In, connected with AWS IAM controls
? Provide a friendly name for your resource that will be used to label this category in the project: <resource-name>
? Enter a name for your user pool: <user-pool-name>
? How do you want users to be able to sign in? Email
? Allow unauthenticated logins? (Provides scoped down permissions that you can control via AWS IAM) No
? Do you want to enable 3rd party authentication providers in your identity pool? No
? Do you want to add User Pool Groups? No
? Do you want to add an admin queries API? No
? Multifactor authentication (MFA) user login options: OFF
? Email based user registration/forgot password: Enabled (Requires per-user email entry at registration)
? Specify an email verification subject: Your verification code
? Specify an email verification message: Your verification code is {####}
? Do you want to override the default password policy for this User Pool? No
? What attributes are required for signing up? Email
? Specify the app's refresh token expiration period (in days): 30
? Do you want to specify the user attributes this app can read and write? No
? Do you want to enable any of the following capabilities? (skip all)
? Do you want to use an OAuth flow? No
? Do you want to configure Lambda Triggers for Cognito? Yes
? Which triggers do you want to enable for Cognito? Post Authentication
? What functionality do you want to use for Post Authentication? Create your own module
Successfully added resource <resourcename>PostAuthentication locally
? Do you want to edit your custom function now? No
```

### 5. Add Storage

```bash
amplify add storage
```

```
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
? Provide a friendly name: fitnessappstorage
? Provide bucket name: fitnessappbucket
? Who should have access: Auth and guest users
? What kind of access for Authenticated users? create/update, read, delete
? What kind of access for Guest users? create/update, read, delete
? Do you want to add a Lambda Trigger? No
```

### 6. Add Lambda Function

```bash
amplify add function
```

```
? Select which capability you want to add: Lambda function
? Provide an AWS Lambda function name: quotegenerator
? Choose the runtime: NodeJS
? Choose the function template: Hello World
? Do you want to configure advanced settings? Yes
? Do you want to access other resources? No
? Do you want to invoke this function on a recurring schedule? No
? Do you want to enable Lambda layers? No
? Do you want to configure environment variables? No
? Do you want to configure secret values? No
? Choose the package manager: NPM
? Do you want to edit the local lambda function now? Yes
```

Edit `amplify/backend/function/quotegenerator/src/index.js`:

```javascript
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    
    const quotes = [
        { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
        { text: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.", author: "Rikki Rogers" },
        { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
        { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
        { text: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
        { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
        { text: "Success starts with self-discipline.", author: "Unknown" },
        { text: "The difference between try and triumph is a little umph.", author: "Unknown" },
        { text: "Sweat is fat crying.", author: "Unknown" },
        { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
        { text: "A one hour workout is 4% of your day. No excuses.", author: "Unknown" },
        { text: "The only way to finish is to start.", author: "Unknown" },
        { text: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Unknown" },
        { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
        { text: "If it doesn't challenge you, it won't change you.", author: "Fred DeVito" },
        { text: "The hardest lift of all is lifting your butt off the couch.", author: "Unknown" },
        { text: "Sore today, strong tomorrow.", author: "Unknown" },
        { text: "You're only one workout away from a good mood.", author: "Unknown" },
        { text: "Excuses don't burn calories.", author: "Unknown" },
        { text: "The only person you should try to be better than is the person you were yesterday.", author: "Unknown" }
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const timestamp = new Date().toISOString();
    
    return {
        message: 'Quote generated successfully! 🎯',
        quote: randomQuote.text,
        author: randomQuote.author,
        timestamp: timestamp,
        totalQuotes: quotes.length
    };
};
```

### 7. Update Auth Function to Access Storage

```bash
amplify update function
```

```
? Select the Lambda function you want to update: <auth-trigger-function-name>PostAuthentication
? Which setting do you want to update? Resource access permissions
? Select the categories you want this function to have access to: storage
? Storage has 2 resources in this project. Select the one you would like your Lambda to access: <fitnessappstorage>
? Select the operations you want to permit on <fitnessappstorage>: create, read, update, delete
? Do you want to edit the local lambda function now? Yes
```

Edit `amplify/backend/function/<resourcename>PostAuthentication/src/index.js`:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client();

exports.handler = async (event) => {
  const timestamp = new Date().toISOString();
  const log = {
    username: event.userName,
    timestamp
  };
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.STORAGE_FITNESSAPPSTORAGE_BUCKETNAME,
    Key: `public/auth-logs/${Date.now()}-${event.userName}.json`,
    Body: JSON.stringify(log),
    ContentType: 'application/json'
  }));
  
  console.log(`${event.userName} logged in at ${timestamp}`);
  return event;
};
```

### 8. Deploy Backend

```bash
amplify push
```

Select **Y** for all prompts to deploy your backend infrastructure.

### 9. Add Hosting (Optional)

```bash
amplify add hosting  # Choose Amplify Console
amplify publish
```

## Development

### Run Development Server

```bash
npm run dev
```

Access the app at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

## Data Models

### Project (Workout Program)
```graphql
type Project {
  id: ID!
  title: String!
  description: String
  status: ProjectStatus!  # ACTIVE, COMPLETED, ON_HOLD, ARCHIVED
  deadline: AWSDateTime
  color: String
  todos: [Todo]
}
```

### Todo (Exercise)
```graphql
type Todo {
  id: ID!
  name: String!
  description: String
  images: [String]  # S3 paths to progress photos
  projectID: ID
}
```

## Security & Permissions

### Authorization Rules

**Projects & Exercises**:
- **Public**: Read-only access
- **Owner**: Full CRUD operations

**Authentication**:
- Cognito-managed user pools
- Email-based sign-in
- Owner-based access control

## Features by User Type

### Unauthenticated Users
- ✅ View all workout programs
- ✅ View all exercises
- ✅ View progress photos
- ❌ Cannot create, edit, or delete

### Authenticated Users
- ✅ Everything unauthenticated users can do
- ✅ Create workout programs
- ✅ Add exercises to any program
- ✅ Upload progress photos
- ✅ Edit/delete own programs and exercises
- ✅ Get daily motivation quotes
- ✅ View login activity logs

## Summary of changes required during Gen1 to Gen2 migration:

Post `amplify gen2-migration generate` :   
   
1. In `main.tsx`    
before: `import amplifyconfig from '../amplifyconfiguration.json';`  
after: `amplifyconfig from '../amplify_outputs.json';` 

2.  In `amplify/data/resource.ts`     
before: `branchName: "<gen1-env-name>"`   
after: `branchName: "gen2-migrate"`   

3. cut `<appnameXXXXXX>PostAuthentication` subfolder from storage and paste in auth folder.    

4. In `function/<appnameXXXXXX>quotegenerator/resource.ts`   
before: `environment: { ENV: ${branchName}  ...`  
after: `environment: { ENV: "gen2-main“ ...`  

5. In `function/<appnameXXXXXX>quotegenerator/handler.ts`   
before: `exports.handler = async (event)`    
after: `export const handler = async (event: any)`    

6. In `auth/<appnameXXXXXX>PostAuthentication/resource.ts`    
before:  `environment: ... , ENV: ${branchName} ...`    
after: `environment: ... , ENV: “gen2-main” ... `   

    add inside define function :   
`name: "authTrigger",`  // Fixes "duplicate handler" CDK construct error.  
`resourceGroupName: "auth"`.  // Fixes CloudFormation circular dependency error.  


7. In `auth/<appnameXXXXXX>PostAuthentication/handler.ts`    
before: `exports.handler = async (event)`    
after: `export const handler = async (event: any)`   

8. In `backend.ts`:  
before: `import { <appnameXXXXXX>PostAuthentication } from "./storage/<appnameXXXXXX>PostAuthentication/resource";`   
after: `import { <appnameXXXXXX>PostAuthentication } from "./auth/<appnameXXXXXX>PostAuthentication/resource";`    

    add the following import to the imports section followed by the code in `backend.ts`:  
Replace `YOUR-BUCKET-NAME` with your S3 bucket name (found in AWS S3 console):  

```typescript

import * as iam from 'aws-cdk-lib/aws-iam';
// ... other imports

// Grant S3 permissions to auth trigger
backend.<appnameXXXXXX>PostAuthentication.resources.lambda.addToRolePolicy(
    new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: [
            'arn:aws:s3:::YOUR-BUCKET-NAME',
            'arn:aws:s3:::YOUR-BUCKET-NAME/*'
        ]
    })
);
```

Post Deploy:  

1. in in `data/resource.ts`:

before: `@function(name: "quotegenerator")`  
after: `@function(name: "amplify-<appId>-gen2<branchName>-handlerlambda<hash>-<suffix>")`  
(Find actual Lambda name in CloudFormation → Stack Resources → search "handlerlambda")

