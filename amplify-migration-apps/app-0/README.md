
<img width="1786" height="920" alt="Screenshot 2025-11-05 at 12 20 29" src="https://github.com/user-attachments/assets/4dcaabc8-5ca1-48f4-b956-14e256ce6b57" />
<img width="1786" height="920" alt="Screenshot 2025-11-05 at 12 20 10" src="https://github.com/user-attachments/assets/fc3aff80-3280-4820-86f3-81467e5ede23" />

# Set up the Amplify app

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
npm install

amplify init
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
amplify add api
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
amplify add auth
```
```
 Do you want to use the default authentication and security configuration? Default configuration
 Warning: you will not be able to edit these selections. 
 How do you want users to be able to sign in? Email
 Do you want to configure advanced settings? No, I am done.
```

```bash
amplify add storage
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
amplify push # select Y for all prompts
```

```bash
amplify add hosting # use the Amplify Console option
amplify publish
```
