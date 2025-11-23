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
npm install @aws-amplify/cli-internal-gen2-migration-alpha
```

This will install a flavor of the amplify Gen1 CLI that includes migration support.

> [!NOTE]  
> Migration is still in early development stages and is therefore versioned with a `0.x` and is not yet 
> integrated into the standard Gen1 CLI. 

### 1. Lock

### 2. Generate

### 3. Deploy

### 4. Refactor

### 5. Decommission


