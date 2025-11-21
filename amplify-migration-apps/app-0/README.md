<img width="1951" height="1225" alt="Screenshot 2025-11-20 at 17 24 01" src="https://github.com/user-attachments/assets/e858ce6f-397d-4107-9dd9-dc2b95576912" />

_Unauthenticated view_

<img width="1957" height="1228" alt="Screenshot 2025-11-20 at 17 23 48" src="https://github.com/user-attachments/assets/400dae37-971e-43ef-8702-8f2b2a32ba54" />

_Authenticated view for Amplify project_
# Set up the Amplify app

## Categories
### api
GraphQL API with schema containing `Todo` and `Project` models.
### auth
Cognito-based auth using email.
### storage
S3-based storage for images in Todos.
### function
Node.js lambda function that generates inspirational quotes.
### hosting
Amplify console-managed hosting.

## Description
This is a project board app that supports authentication. Each Project board can hold multiple Todo items, each of which has a title, description, and optionally, images. Todos do not need to be in a Project and can exist unassigned.

Unauthenticated users can only view Projects and Todos, and cannot modify or delete them.

Authenticated users can create Projects and Todos, and modify/delete their own. They may add Todos to Projects that are not their own, but cannot change the Project settings.

The images on each Todo use amplify S3 Storage. The Todos themselves use DynamoDB, and CRUD operations are via GraphQL with Amplify Api. Auth is managed through Cognito. Hosting is managed through Amplify console.

## Prerequisites
Install Node 25 (stable at time of writing)

```bash
$ node -v
v25.2.1
```

[Amplify Gen1 Getting Started](https://docs.amplify.aws/gen1/react/start/getting-started/installation/) 

## Setup
```bash
# in app-0
$ npm install

$ amplify init
```
- Select all default options except for "Distribution Directory Path", which will be `dist` (not `build`)
- In this step, we are assuming that you have set up the `default` AWS profile with the relevant permissions for Amplify on your AWS account

```
? Initialize the project with the above configuration? No
? Enter a name for the environment dev
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

```bash
$ amplify add api
```
Default settings:
- ❯ GraphQL
```
Name: amplifytestapp2 
Authorization modes: API key (default, expiration time: 7 days from now) 
Conflict detection (required for DataStore): Disabled 
```
- ❯ Single object with fields (e.g., “Todo” with ID, name, description) 

Edit the schema:
```ts
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
  getRandomQuote: QuoteResponse @function(name: "quote-generator-dev") 
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

```bash
$ amplify add auth
```
```
 Do you want to use the default authentication and security configuration? Default configuration
 Warning: you will not be able to edit these selections. 
 How do you want users to be able to sign in? Email
 Do you want to configure advanced settings? No, I am done.
```

```bash
$ amplify add storage
```
```
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
✔ Provide a friendly name for your resource that will be used to label this category in the project: · s3d40f26c3
✔ Provide bucket name: · amplifytestapp27f4b17460f7f4f8dbf123f22561e49b1
✔ Who should have access: · Auth and guest users
✔ What kind of access do you want for Authenticated users? · create/update, read, delete
✔ What kind of access do you want for Guest users? · create/update, read, delete
✔ Do you want to add a Lambda Trigger for your S3 Bucket? (y/N) · no
```

```bash
$ amplify-dev add function
? Select which capability you want to add: Lambda function (serverless function)
? Provide an AWS Lambda function name: quote-generator # make sure this name matches the name under `Query` in the GraphQL schema (without -dev)!
? Choose the runtime that you want to use: NodeJS
? Choose the function template that you want to use: Hello World

✅ Available advanced settings:
- Resource access permissions
- Scheduled recurring invocation
- Lambda layers configuration
- Environment variables configuration
- Secret values configuration

? Do you want to configure advanced settings? Yes
? Do you want to access other resources in this project from your Lambda function? No
? Do you want to invoke this function on a recurring schedule? No
? Do you want to enable Lambda layers for this function? No
? Do you want to configure environment variables for this function? No
? Do you want to configure secret values this function can access? No
✔ Choose the package manager that you want to use: · NPM
? Do you want to edit the local lambda function now? Yes
Edit the file in your editor: /Users/ianhou/workplace/amplify-cli/amplify-migration-apps/app-0/amplify/backend/function/quote-generator/src/index.js
```

Overwrite the Hello World code in `index.js` with the following:
```js
/**
 * AppSync Lambda function handler
 * When using @function directive, return data directly (not API Gateway proxy format)
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    
    // Array of motivational quotes
    const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
        { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
        { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
        { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
        { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
        { text: "Java is to JavaScript what car is to Carpet.", author: "Chris Heilmann" },
        { text: "Knowledge is power.", author: "Francis Bacon" },
        { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
        { text: "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.", author: "Antoine de Saint-Exupery" },
        { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine" },
        { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
        { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" }
    ];
    
    // Get a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Add timestamp for uniqueness
    const timestamp = new Date().toISOString();
    
    // For AppSync @function directive, return the data object directly
    return {
        message: 'Quote generated successfully! 🎯',
        quote: randomQuote.text,
        author: randomQuote.author,
        timestamp: timestamp,
        totalQuotes: quotes.length
    };
};

```


```bash
? Press enter to continue 
✅ Successfully added resource quote-generator locally.
```

```bash
amplify push # select Y for all prompts
```

```bash
amplify add hosting # use the Amplify Console option
amplify publish
```
