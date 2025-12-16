# Implementation Plan: Custom Resource Dependencies Migration

## Feature Type: MIGRATION

## What I Found in Documentation

### Gen1 Implementation Methods

1. **Custom CloudFormation Resources** - Direct CloudFormation templates with parameters
   ```yaml
   # amplify/backend/custom/myCustomResource/template.json
   {
     "AWSTemplateFormatVersion": "2010-09-09",
     "Parameters": {
       "env": { "Type": "String" },
       "authRoleArn": { "Type": "String" },
       "unauthRoleArn": { "Type": "String" }
     },
     "Resources": {
       "MyCustomBucket": {
         "Type": "AWS::S3::Bucket",
         "Properties": {
           "BucketName": { "Fn::Sub": "my-bucket-${env}" }
         }
       }
     },
     "Outputs": {
       "BucketName": { "Value": { "Ref": "MyCustomBucket" } }
     }
   }
   ```
   - File path: `amplify/backend/custom/[resourceName]/template.json`
   - Key characteristics: Uses CloudFormation parameters for cross-resource references

2. **Custom Resources with Dependencies** - References other Amplify resources via parameters
   ```yaml
   # amplify/backend/custom/dependentResource/template.json
   {
     "Parameters": {
       "storageS3BucketName": { "Type": "String" },
       "authUserPoolId": { "Type": "String" }
     },
     "Resources": {
       "LambdaFunction": {
         "Type": "AWS::Lambda::Function",
         "Properties": {
           "Environment": {
             "Variables": {
               "BUCKET_NAME": { "Ref": "storageS3BucketName" },
               "USER_POOL_ID": { "Ref": "authUserPoolId" }
             }
           }
         }
       }
     }
   }
   ```
   - File path: `amplify/backend/custom/[resourceName]/template.json`
   - Key characteristics: Uses parameters to reference other Amplify category resources

3. **Custom Resource Parameters** - Configuration via parameters.json
   ```json
   // amplify/backend/custom/myResource/parameters.json
   {
     "storageS3BucketName": {
       "Ref": "storage-s3-bucket-name"
     },
     "authUserPoolId": {
       "Ref": "auth-user-pool-id"
     }
   }
   ```
   - File path: `amplify/backend/custom/[resourceName]/parameters.json`
   - Key characteristics: Maps Amplify resource outputs to custom resource parameters

### Gen2 Implementation Methods

1. **CDK Custom Resources** - TypeScript CDK constructs with direct references
   ```typescript
   // amplify/custom/myCustomResource/resource.ts
   import { defineCustom } from '@aws-amplify/backend';
   import * as s3 from 'aws-cdk-lib/aws-s3';
   import * as lambda from 'aws-cdk-lib/aws-lambda';

   export const myCustomResource = defineCustom({
     name: 'myCustomResource',
     stack(scope, { storage, auth }) {
       const bucket = new s3.Bucket(scope, 'MyCustomBucket', {
         bucketName: `my-bucket-${scope.node.addr}`
       });

       const fn = new lambda.Function(scope, 'MyFunction', {
         environment: {
           BUCKET_NAME: storage.resources.bucket.bucketName,
           USER_POOL_ID: auth.resources.userPool.userPoolId
         }
       });

       return { bucket, fn };
     }
   });
   ```
   - File path: `amplify/custom/[resourceName]/resource.ts`
   - Key characteristics: Direct TypeScript references to other resources via function parameters

2. **Backend Resource References** - Access to other backend resources through context
   ```typescript
   // amplify/backend.ts
   import { defineBackend } from '@aws-amplify/backend';
   import { auth } from './auth/resource';
   import { storage } from './storage/resource';
   import { myCustomResource } from './custom/myCustomResource/resource';

   export const backend = defineBackend({
     auth,
     storage,
     myCustomResource
   });
   ```
   - File path: `amplify/backend.ts`
   - Key characteristics: Resources are passed as parameters to custom resource stack function

## What Changed (Gen1 → Gen2)

| What | Gen1 | Gen2 | Why It Changed |
|------|------|------|----------------|
| File location | `amplify/backend/custom/[name]/template.json` | `amplify/custom/[name]/resource.ts` | CDK uses TypeScript instead of JSON CloudFormation |
| Syntax | CloudFormation JSON/YAML | CDK TypeScript constructs | Better type safety and IDE support |
| Dependencies | Parameters and Ref functions | Direct object references | Compile-time dependency validation |
| Resource access | `{ "Ref": "parameterName" }` | `storage.resources.bucket.bucketName` | Type-safe property access |
| Configuration | `parameters.json` file | Function parameters in stack() | Integrated into resource definition |

## What Exists in Current Codebase

- Found in `amplify-cli/packages/amplify-category-custom`: Gen1 custom resource implementation
- Current implementation uses: CloudFormation templates with parameter injection
- Files to migrate: 
  - `template.json` → `resource.ts`
  - `parameters.json` → integrated into stack function
  - `cli-inputs.json` → backend configuration

## Categorize All Differences

From the line-by-line comparison, categorize changes:

- **Syntax changes**: 
  - CloudFormation JSON → CDK TypeScript
  - `{ "Ref": "param" }` → `resource.property`
  - `{ "Fn::Sub": "string-${param}" }` → template literals

- **File structure changes**: 
  - `amplify/backend/custom/` → `amplify/custom/`
  - `template.json` → `resource.ts`
  - `parameters.json` eliminated

- **Pattern changes**: 
  - Parameter-based dependency injection → Direct object references
  - CloudFormation intrinsic functions → CDK construct properties
  - Separate configuration files → Integrated resource definition

- **Removed features**: 
  - `parameters.json` configuration
  - CloudFormation template validation
  - Amplify CLI parameter injection

- **New requirements**: 
  - TypeScript knowledge
  - CDK construct understanding
  - Backend resource registration in `backend.ts`

## Task List

### Task 0: Create Gen1 and Gen2 apps with custom resource dependencies
Create a Gen1 app with custom resources that reference storage and auth
Create a Gen2 app with equivalent custom resources
Compare the implementation differences

### Task 1: Convert CloudFormation template to CDK construct
**What needs to change**: Transform JSON CloudFormation template to TypeScript CDK construct
**Why the change is necessary**: Gen2 uses CDK instead of raw CloudFormation for better type safety
**Current state**: CloudFormation JSON template in `amplify/backend/custom/[name]/template.json`

### Task 2: Replace parameter-based dependencies with direct references
**What needs to change**: Convert CloudFormation parameters and Ref functions to direct CDK property access
**Why the change is necessary**: Gen2 provides direct access to resource properties instead of parameter injection
**Current state**: Dependencies defined via parameters.json and CloudFormation Ref functions

### Task 3: Migrate resource outputs to CDK return values
**What needs to change**: Convert CloudFormation Outputs section to TypeScript return object
**Why the change is necessary**: Gen2 uses function return values instead of CloudFormation outputs
**Current state**: Outputs defined in CloudFormation template Outputs section

### Task 4: Update file structure and naming conventions
**What needs to change**: Move files from `amplify/backend/custom/` to `amplify/custom/` and rename appropriately
**Why the change is necessary**: Gen2 has different directory structure and uses TypeScript files
**Current state**: Files in Gen1 custom resource directory structure

### Task 5: Register custom resources in backend configuration
**What needs to change**: Add custom resource imports and registration to `amplify/backend.ts`
**Why the change is necessary**: Gen2 requires explicit resource registration in backend definition
**Current state**: Gen1 automatically discovers custom resources in backend directory

### Task 6: Handle cross-resource dependencies in stack function
**What needs to change**: Update custom resource to receive other resources as function parameters
**Why the change is necessary**: Gen2 passes dependencies as parameters to the stack function
**Current state**: Dependencies accessed via CloudFormation parameters

### Task 7: Convert environment variable references
**What needs to change**: Update Lambda environment variables from CloudFormation Ref to direct property access
**Why the change is necessary**: Gen2 provides direct access to resource properties
**Current state**: Environment variables use CloudFormation Ref functions to access parameters

### Task 8: Update resource naming and logical IDs
**What needs to change**: Ensure CDK construct IDs match CloudFormation logical IDs for resource continuity
**Why the change is necessary**: Maintain resource identity during migration to avoid recreation
**Current state**: CloudFormation logical IDs defined in template.json