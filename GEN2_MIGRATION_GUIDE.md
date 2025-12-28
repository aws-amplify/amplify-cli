# Amplify Gen1 → Gen2 Migration Guide (Alpha)

Following document describes how to migrate your Gen1 environment to a new Gen2 application.

> [!CAUTION]
> The tools presented here are in early stages of development and **SHOULD NOT** be executed on 
> any production or mission critical environments.

## Overall Approach

Migration to Gen2 is done in a (partial) blue/green deployment approach.

1. Amplify CLI will code-generate the neccessary Gen2 definition files based on your deployed Gen1 environment.
2. These new files will be pushed to a new branch and deployed via the hosting service.
3. Amplify CLI will refactor your underlying CloudFormation stacks such that any Gen1 stateful resource (e.g `UserPool`) 
will be reused and managed by the new Gen2 deployment.

After completing this process you will have 2 functionally equivalent amplify applications that access the same data. 
Once appropriate, you can decommission the Gen1 environment and continue managing your app through the Gen2 definition files.

## Step By Step

For the purpose of this guide, we assume:

- Your Gen1 environment is stored in the `main` branch of a `GitHub` repository.
- Your frontend code is located within the same repository as your backend application.

First obtain a fresh and up-to-date local copy of your Amplify Gen1 environment and run the following:

```bash
npm install --no-save @aws-amplify/cli-internal-gen2-migration-alpha
```

This will install a flavor of the amplify Gen1 CLI that includes migration support.

> [!NOTE]  
> Migration is still in early development stages and is therefore versioned with a `0.x` and is not yet 
> integrated into the standard Gen1 CLI. 

### 1. Lock

During the migration period your Gen1 environment should not undergo any changes; otherwise we run 
the risk of code-generating an incomplete application and possibly encountering unexpected migration failures.

To ensure this, run the following:

```bash
npx amplify gen2-migration lock
```

This command will first perform a few validations to ensure your Gen1 environment is in a 
healthy state and proceed to lock your Gen1 environment by attaching a restrictive stack policy on the root stack. 

> [!TIP]
> It is also advisable to disable any automatic pipelines that deploy to your Gen1 environment.

### 2. Generate

Next, generate your Gen2 definition files by running the following:

```bash
git checkout -b gen2-main
npx amplify gen2-migration generate
```

This command will override your local `./amplify` directory with Gen2 definition files. Once successfull, 
perform the following manual edits:

**In `./src/main.tsx` (or equivalent):**

```diff
- import amplifyconfig from './amplifyconfiguration.json';
+ import amplifyconfig from '../amplify_outputs.json';
```

This is required because in Gen2 amplify generates an `amplify_outputs.json` file instead of the `amplifyconfiguration.json` file. 
Note that client side libraries support both files so no additional change is needed.

**In `./amplify/data/resource.ts`:**

```diff
- branchName: "<gen1-env-name>"
+ branchName: "gen2-main"
```

This is required in order to instruct the hosting service that DynamoDB tables 
should be reused (imported) instead of recreated.


### 3. Deploy

To deploy the generated Gen2 application first push the code:

```bash
git add .
git commit -m "feat: migrate to gen2"
git push origin gen2-main
```

Next, login to the AWS Amplify console and connect your new branch to the existing application:

**App Settings → Branch Settings → Add Branch**

![](./migration-guide-images/add-branch.png)

Once added the hosting service will start deploying this branch. Wait for it to complete.

![](./migration-guide-images/deploying-branch.png)

Once completed you can login to your app via the newly dedicated amplify domain. At this point, 
the application has access only to the DynamoDB data from your Gen1 environment. **It does not 
however reuse other stateful resources such as user pools.** To grant it access to all 
stateful resources, a `refactor` is required.

### 4. Refactor

Refactoring is the process of updating the underlying CloudFormation stacks of both your Gen1 and 
Gen2 applications such that all stateful resources are reused across both apps. In order to refactor, 
we first need to find the name of the Gen2 root CloudFormation stack:

1. Login to the AWS CloudFormation console.
2. Find a root stack that has the following name pattern: `amplify-<appId>-gen2main-branch-<suffix>`

![](./migration-guide-images/find-stack.png)

Then, run the following:

```bash
git checkout main
npx amplify gen2-migration refactor --to <gen2-root-stack-name>
```

Once the command succeeds, login to the AWS Amplify console and redeploy the Gen2 branch:

![](./migration-guide-images/redeploy.png)

This is required in order to regenerate the `amplify_outputs.json` file that corresponds to the stack 
architecture that was updated during `refactor`.

### 5. Decommission

The final step of the migration is the decommissioning of your Gen1 environment. This can be done at your own pace and only after:

1. You've validated the Gen2 application works as expected.
2. You've validated the Gen1 application no longer accepts external traffic. If you have a webapp this can be achieved be performing 
a domain shift. If you have a mobile app you'll need to wait until all customers upgrade to the new version of your 
app (the one shipped with the new `amplify_outputs.json` configuration file)


```bash
git checkout main
npx amplify gen2-migration decommission
```

# Support Overview

Following provides an overview of the supported (and unsupported) features for migration.

## CLI Inputs

### Auth | `amplify add auth`

- [ ] **Default Configuration**

  - [X] Username
  - [X] Email
  - [ ] Phone Number
  - [ ] Email or Phone Number

### Api | `amplify add api`

- [ ] **GraphQL**

  - **Authorization Mode**

    - [ ] API Key
    - [ ] Cognito

- **Authorization Mode**

### Functions | `amplify add function`

- [ ] **Lambda function (serverless function)**

  - [ ] Runtime

    - [ ] NodeJS

## GraphQL Schema

## Function Code

## Custom Resource Code

## Overrides Code

## Edge cases

- [ ] Two functions defined in the schema via `@function` directive.
