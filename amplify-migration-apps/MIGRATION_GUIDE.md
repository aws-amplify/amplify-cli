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

In `./src/main.tsx` (or equivalent):

```diff
- import amplifyconfig from './amplifyconfiguration.json';
+ import amplifyconfig from '../amplify_outputs.json';
```

> [!NOTE]
> Required because in Gen2 amplify generates an `amplify_outputs.json` file instead of the `amplifyconfiguration.json` file. Note that client side libraries support both files so no additional change is needed.

In `./amplify/data/resource.ts`:

```diff
- branchName: "<gen1-env-name>"
+ branchName: "migrate"
```

> [!NOTE]
> Required in order to instruct the hosting service that DynamoDB tables should be reused (imported) instead of recreated.


### 3. Deploy

### 4. Refactor

### 5. Decommission


