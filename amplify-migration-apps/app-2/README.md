Sai

# Description:

...work in progress...

# SETUP

### STEP 0. RUN: npm create vite@latest

Prompts:
```
Project Name - discusapp  
Framework - javascript  
Use rolldown-vite (Experimental)?: No  
Install with npm and start now? No  
```
Terminal:
```
cd discus-project  
npm install
``` 

### STEP 1. RUN: amplify init  

Prompts:  
```
Do you want to continue with Amplify Gen 1? (y/N) · yes  
Why would you like to use Amplify Gen 1? · Prefer not to answer  
Enter a name for the project discusapp  

The following configuration will be applied:  
Project information  
| Name: discusproject  
| Environment: dev  
| Default editor: Visual Studio Code  
| App type: javascript  
| Javascript framework: none  
| Source Directory Path: src  
| Distribution Directory Path: dist  
| Build Command: npm run-script build  
| Start Command: npm run-script start  

? Initialize the project with the above configuration? Yes  
Using default provider awscloudformation  
? Select the authentication method you want to use: AWS profile  
```

### STEP 2. RUN: amplify add auth

Prompts:
```
Using service: Cognito, provided by: awscloudformation  

The current configured provider is Amazon Cognito.  
-Do you want to use the default authentication and security configuration? Manual configuration  
-Select the authentication/authorization services that you want to use: User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more) (Important for DynamoDB)  
-Provide a friendly name for your resource that will be used to label this category in the project: discusAuth  
-Enter a name for your identity pool. discusIdentityPool  
-Allow unauthenticated logins? (Provides scoped down permissions that you can control via AWS IAM) No  
-Do you want to enable 3rd party authentication providers in your identity pool? No  
-Provide a name for your user pool: discusUserPool  
Warning: you will not be able to edit these selections.  
-How do you want users to be able to sign in? Phone Number  
-Do you want to add User Pool Groups? No  
-Do you want to add an admin queries API? No  
-Multi-factor authentication (MFA) user login options: OFF  
-Email based user registration/forgot password: Enabled (Requires per-user email entry at registration)  
-Specify an email verification subject: Your verification code  
-Specify an email verification message: Your verification code is {####}  
-Do you want to override the default password policy for this User Pool? No  
Warning: you will not be able to edit these selections.  
-What attributes are required for signing up? Email  
-Specify the app's refresh token expiration period (in days): 120  
-Do you want to specify the user attributes this app can read and write? No  
-Do you want to enable any of the following capabilities? (skip by pressing enter)  
-Do you want to use an OAuth flow? No  
? Do you want to configure Lambda Triggers for Cognito? No  
```
NOTE: Important for DynamoDB -  Select the authentication/authorization services that you want to use:   
User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more)

### STEP 3. RUN: amplify add api

Prompts:
```
-Select from one of the below mentioned services: GraphQL  
? Here is the GraphQL API that we will create. Select a setting to edit or continue Continue  
? Choose a schema template: One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)  

Do you want to edit the schema now? (Y/n) › n  
```
### STEP 4. RUN: amplify add storage  
```

? Select from one of the below mentioned services: NoSQL Database  

Welcome to ....blabla.... database table.  

✔ Provide a friendly name · discusTable  
✔ Provide table name · discusTable  

You can now add columns to the table.  

✔ What would you like to name this column · id  
✔ Choose the data type · string  
✔ Would you like to add another column? (Y/n) · yes  
✔ What would you like to name this column · col1  
✔ Choose the data type · string  
✔ Would you like to add another column? (Y/n) · yes  
✔ What would you like to name this column · col2  
✔ Choose the data type · string  
✔ Would you like to add another column? (Y/n) · no  

Before you ....blabla.... sort key.  

✔ Choose partition key for the table · id   
✔ Do you want to add a sort key to your table? (Y/n) · yes  
✔ Choose sort key for the table · col1  

You can ....blabla.... primary key.  

✔ Do you want to add global secondary indexes to your table? (Y/n) · yes  
✔ Provide the GSI name · col1index  
✔ Choose partition key for the GSI · col1  
✔ Do you want to add a sort key to your global secondary index? (Y/n) · yes  
✔ Choose sort key for the GSI · col2  
✔ Do you want to add more global secondary indexes to your table? (Y/n) · no  
✔ Do you want to add a Lambda Trigger for your Table? (y/N) · no  
```
### STEP 5. RUN: amplify add function
```
Select: Lambda function (serverless function)  
Function name: postViewCounter (MUST MATCH THIS)  
Runtime: NodeJS   
Template: Hello World  
Configure advanced settings: Yes  
Access other resources: Yes  
Select categories: storage (use spacebar to select)  
Select your DynamoDB table  
Grant permissions: create, read, update, delete  
Recurring schedule: No  
Lambda layers: No  
Environment variables: No  
Secret values: No  
Package manager: NPM  
Edit now: No  
```
NOTE: FUNCTION NAME SHOULD STRICTLY BE postViewCounter (hardcoded for ease of setup)

### STEP 6. Edit lambda code:  

Edit: amplify/backend/function/postViewCounter/src/index.js  

```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');  
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');  

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));  
const tableNameKey = Object.keys(process.env).find(key => key.startsWith('STORAGE_') && key.endsWith('_NAME'));  
const TABLE_NAME = process.env[tableNameKey];  

exports.handler = async (event) => {
  const postId = event.arguments?.postId;
  if (!postId) throw new Error('Post ID required');
  
  const result = await dynamoDB.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: `post-${postId}`, col1: postId }
  }));
  
  if (!result.Item) throw new Error('Post not found');
  
  const parts = result.Item.col2.split('|');
  const newViews = (parseInt(parts[3]) || 0) + 1;
  
  await dynamoDB.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id: `post-${postId}`,
      col1: postId,
      col2: `${parts[0]}|${parts[1]}|${parts[2]}|${newViews}`
    }
  }));
  
  return { views: newViews };
};
```

Note: This code uses dynamic table name lookup and works without modification.   
Important: Do not add more than one DynamoDB table to your project.

This file is also provided separately (find it here)

### STEP 7. Update GraphQL schema:

Add to amplify/backend/api/YOUR_API_NAME/schema.graphql:
```graphql
# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: https://docs.amplify.aws/cli/graphql/authorization-rules
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!

type Blog @model {
  id: ID!
  name: String!
  posts: [Post] @hasMany
}

type Post @model {
  id: ID!
  title: String!
  blog: Blog @belongsTo
  comments: [Comment] @hasMany
}

type Comment @model {
  id: ID!
  post: Post @belongsTo
  content: String!
}

type Mutation {
  incrementViews(postId: ID!): ViewCount @function(name: "postViewCounter-${env}")
}

type ViewCount {
  views: Int!
}
```
This file is also provided separately (find it here)
### STEP 8. RUN: amplify push
```
✔ Are you sure you want to continue? (Y/n) · yes  

⚠️ WARNING: ....blabla.... Edit your schema at /....blabla....path.  

? Do you want to generate code for your newly created GraphQL API Yes  
? Choose the code generation language target typescript  
? Enter the file name pattern of graphql queries, mutations and subscriptions src/graphql/**/*.ts  
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions Yes  
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2  
? Enter the file name for the generated code src/API.ts  
```
### STEP 9. Install Dependencies

RUN: npm install aws-amplify @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb  

### STEP 10. Add IAM Permissions (AWS Console):  

Go to IAM → Roles  
Find: amplify-discus-xxxxx-authRole  
Click Add permissions → Attach policies  
Search and attach: AmazonDynamoDBFullAccess  

### STEP 11. Add Application Files:  

Download or copy the provided application files:  
- index.html → Place in project root directory (same level as package.json)  
- main.js → Place in src/ directory  

These files are provided separately (find them here) and work without modification.  

### STEP 12. RUN: npm run dev 

### STEP 13. In App: First Time User Setup

1. Sign Up in App:  
Phone number format: +1234567890 (include country code)  
Email format: user@example.com  
Password:  
Click Sign Up  

2. Confirm User (AWS Console):  
You'll be redirected to the SMS confirmation page.   
Manually confirm the user (if SNS is not configured):  

     ↳Go to AWS Console → Cognito → User Pools  
     ↳Click on your user pool: discusUserPool  
     ↳Find your user (shows up with the email)  
     ↳Click on the user  
     ↳Click Actions (Top-right) → Confirm account  

Status changes from "UNCONFIRMED" to "CONFIRMED" ✅  
 
3. Sign In:  
  ↳Go back to the app  
  ↳Click "Back to sign in"  
  ↳Enter your phone number and password  
  ↳Click Sign In  

