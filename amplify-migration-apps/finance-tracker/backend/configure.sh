#!/bin/bash
set -euxo pipefail

# Copy GraphQL schema
cp -f backend/schema.graphql ./amplify/backend/api/financetracker/schema.graphql

# Copy Lambda function source
cp -f backend/financetracker.js ./amplify/backend/function/financetracker/src/index.js

# Copy custom policies for the Lambda function
cp -f backend/custom-policies.json ./amplify/backend/function/financetracker/custom-policies.json

# Copy CDK stack for customfinance (SNS topics)
cp -f backend/customfinance.ts ./amplify/backend/custom/customfinance/cdk-stack.ts

# Copy CDK stack for customresolver
cp -f backend/customresolver.ts ./amplify/backend/custom/customresolver/cdk-stack.ts
