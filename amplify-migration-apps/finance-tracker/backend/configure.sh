#!/bin/bash
set -euxo pipefail

# Get the function directory name (in case the hash suffix changes after re-init)
function_name=$(ls amplify/backend/function | grep -v financetracker48ceb8c2 | head -1)

# Copy GraphQL schema
cp -f backend/schema.graphql ./amplify/backend/api/financetrackerfinal/schema.graphql

# Copy Lambda function source
cp -f backend/financetracker.js ./amplify/backend/function/${function_name}/src/index.js

# Copy custom policies for the Lambda function
cp -f backend/custom-policies.json ./amplify/backend/function/${function_name}/custom-policies.json

# Copy CloudFormation template with custom environment variables
cp -f backend/financetrackere30b1453-cloudformation-template.json ./amplify/backend/function/${function_name}/${function_name}-cloudformation-template.json

# Copy CDK stack for customfinance (SNS topics)
cp -f backend/customfinance.ts ./amplify/backend/custom/customfinance/cdk-stack.ts

# Copy CDK stack for customresolver
cp -f backend/customresolver.ts ./amplify/backend/custom/customresolver/cdk-stack.ts
