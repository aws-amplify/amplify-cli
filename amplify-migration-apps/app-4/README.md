# Fitness Goal Tracker

A fitness tracking application built with AWS Amplify Gen1, React, and TypeScript. Track your workout programs, exercises, and progress with photos while staying motivated with daily fitness quotes.

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

### Login Activity Tracking
- Automatic login logging via Cognito trigger
- View recent login history in CloudWatch logs

### Dark Mode
- Comfortable viewing in any lighting
- Automatic theme persistence
- Fitness-themed color palette

### Authentication & Security
- Read-only mode for unauthenticated users
- Full CRUD access for authenticated users
- Owner-based permissions
- Secure AWS Cognito authentication


### Backend (AWS Amplify Gen1)
- **GraphQL API**: AppSync with DynamoDB
- **Authentication**: Amazon Cognito with Post Authentication trigger
- **Storage**: Amazon S3 for progress photos
- **Serverless Functions**: AWS Lambda for auth logging (Logs can be checked in CloudWatch)
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
- Template: **Single object with fields**
Edit the graphql schema now:   
copy the following piece of code to schema.graphql:

```graphql
# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: https://docs.amplify.aws/cli/graphql/authorization-rules
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!

type QuoteResponse {
  message: String!
  quote: String!
  author: String!
  timestamp: String!
  totalQuotes: Int!
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator") 
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


### 6. Update Auth Function to Access Storage

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

The `index.js` file is auto-generated and loads `custom.js` via the `MODULES` environment variable. Delete the `custom.js` file and replace `index.js` with the following code :  


```javascript
exports.handler = async (event) => {
  const message = `Welcome ${event.userName}! You logged in at ${new Date().toISOString()}`;
  console.log(message);
  return event;
};
```


### 7. Deploy Backend

```bash
amplify push
```

Select **Y** for all prompts to deploy your backend infrastructure.

### 8. Add Hosting (Optional)

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

## Summary of changes required during Gen1 to Gen2 migration:

Post `amplify gen2-migration generate` :

1. in `data/resource.ts`:   
before:  `branchName: "main"`  
after:  `branchName: "gen2-main"` 

2.  in `main.tsx`:     
before: `import amplifyconfig from './amplifyconfiguration.json';`   
after: `import amplifyconfig from '../amplify_outputs.json';`

3.  in `auth/<functionname>/resource.ts`:  
before: `environment: { MODULES: "custom", ENV: `${branchName}`, REGION: "us-east-1" }`,  
after: DELETE THIS ENTIRE LINE ~`environment: { MODULES: "custom", ENV: `${branchName}`, REGION: "us-east-1" }`~

4. in : `auth/<functionname>/handler.ts` (TS error and ES6 module format)  
before: `exports.handler = async (event)`  
after: `export const handler = async (event: any)`   
