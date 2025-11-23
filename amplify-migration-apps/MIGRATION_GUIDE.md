# Amplify Gen1 → Gen2 Migration Guide

Following document describes how to migrate your Gen1 environment to a new Gen2 application.

## Overall Approach

Migration to Gen2 is done in a (partial) blue/green deployment approach.

1. Amplify CLI will automatically code-generate the neccessary Gen2 definition files based on your deployed Gen1 environment.
2. These new files will be pushed to a new branch and deployed via the hosting service.
3. Amplify CLI will refactor your underlying CloudFormation stacks such that any Gen1 stateful resource (e.g `UserPool`) will be managed by the new Gen2 deployment.

After completing this process you will have 2 functionally equivalent amplify applications that access the same data. Once appropriate, you can decommission the Gen1 environment and continue managing your app through the Gen2 definition files.

## Step By Step

For the purpose of this guide, we assume:

- Your Gen1 environment is stored in the `main` branch of a `GitHub` repository.
- Your frontend code is located within the same repository as your backend application.

First obtain a fresh and up-to-date local copy of your Amplify Gen1 environment. 

### 1. Lock

### 2. Generate

### 3. Deploy

### 4. Refactor

### 5. Decommission


