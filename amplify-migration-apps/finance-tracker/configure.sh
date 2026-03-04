#!/bin/bash
set -euxo pipefail

# Get the function directory name (in case the hash suffix changes after re-init)
function_name=$(ls amplify/backend/function | grep -v financetracker48ceb8c2 | head -1)

# Copy GraphQL schema
cp -f schema.graphql ./amplify/backend/api/financetracker/schema.graphql

# Copy Lambda function source
cp -f financetracker.js ./amplify/backend/function/${function_name}/src/index.js
cp -f financetracker.package.json ./amplify/backend/function/${function_name}/src/package.json

# Copy custom policies for the Lambda function
cp -f custom-policies.json ./amplify/backend/function/${function_name}/custom-policies.json

# Copy CloudFormation template with custom environment variables
cp -f financetrackere30b1453-cloudformation-template.json ./amplify/backend/function/${function_name}/${function_name}-cloudformation-template.json

# Copy CDK stack for customfinance (SNS topics)
cp -f customfinance.ts ./amplify/backend/custom/customfinance/cdk-stack.ts

