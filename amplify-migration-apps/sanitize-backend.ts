#!/usr/bin/env npx tsx

/**
 * Sanitizes sensitive values in Amplify project files for safe public commit.
 *
 * Usage: cd into an app's _snapshot.input directory, then run:
 *   npx tsx ../../sanitize-backend.ts
 *
 * Strategy:
 * 1. Extract sensitive values from amplify-meta.json in a structured way
 * 2. Replace ALL occurrences of those values across all files
 *
 * Targets (one of each):
 * - AWS Account ID (from providers.awscloudformation ARN)
 * - Amplify App ID (from providers.awscloudformation)
 * - Deployment Bucket Name (from providers.awscloudformation)
 * - Cognito User Pool ID (from auth output)
 * - GraphQL API ID (from api output)
 * - AppSync API Key (from api output)
 */

import * as fs from 'fs';
import * as path from 'path';

const AMPLIFY_DIR = path.join(process.cwd(), 'amplify');
const AMPLIFY_META: any = JSON.parse(fs.readFileSync(path.join(AMPLIFY_DIR, 'backend', 'amplify-meta.json'), 'utf-8'));

interface SensitiveValues {
  accountId: string;
  amplifyAppId: string;
  deploymentBucketName: string;
  cognitoUserPoolId: string | null;
  graphqlApiId: string | null;
  apiKey: string | null;
}

function extractAccountId(): string {
  const authRoleArn = AMPLIFY_META.providers.awscloudformation.AuthRoleArn;
  const arnMatch = authRoleArn.match(/arn:aws:iam::(\d{12}):/);
  if (!arnMatch) {
    throw new Error('Could not extract AWS Account ID from AuthRoleArn');
  }
  return arnMatch[1];
}

function extractAmplifyAppId(): string {
  const appId = AMPLIFY_META.providers.awscloudformation.AmplifyAppId;
  if (!appId) {
    throw new Error('Could not extract Amplify App ID from amplify-meta.json');
  }
  return appId;
}

function extractDeploymentBucketName(): string {
  const bucketName = AMPLIFY_META.providers.awscloudformation.DeploymentBucketName;
  if (!bucketName) {
    throw new Error('Could not extract DeploymentBucketName from amplify-meta.json');
  }
  return bucketName;
}

function extractCognitoUserPoolId(): string | null {
  if (!AMPLIFY_META.auth) return null;
  const firstAuthResource = Object.keys(AMPLIFY_META.auth)[0];
  return AMPLIFY_META.auth[firstAuthResource]?.output?.UserPoolId ?? null;
}

function extractGraphqlApiId(): string | null {
  if (!AMPLIFY_META.api) return null;
  const firstApiResource = Object.keys(AMPLIFY_META.api)[0];
  return AMPLIFY_META.api[firstApiResource]?.output?.GraphQLAPIIdOutput ?? null;
}

function extractApiKey(): string | null {
  if (!AMPLIFY_META.api) return null;
  const firstApiResource = Object.keys(AMPLIFY_META.api)[0];
  return AMPLIFY_META.api[firstApiResource]?.output?.GraphQLAPIKeyOutput ?? null;
}

function extractSensitiveValues(): SensitiveValues {
  return {
    accountId: extractAccountId(),
    amplifyAppId: extractAmplifyAppId(),
    deploymentBucketName: extractDeploymentBucketName(),
    cognitoUserPoolId: extractCognitoUserPoolId(),
    graphqlApiId: extractGraphqlApiId(),
    apiKey: extractApiKey(),
  };
}

function getFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function getAllFiles(): string[] {
  return getFilesRecursive(AMPLIFY_DIR);
}

function main(): void {
  const values = extractSensitiveValues();
  const files = getAllFiles();

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    content = content.replaceAll(values.accountId, '123456789012');
    content = content.replaceAll(values.amplifyAppId, 'xxxxxxxxxxxxx');
    content = content.replaceAll(values.deploymentBucketName, 'amplify-xxxxx-deployment');

    if (values.cognitoUserPoolId) {
      content = content.replaceAll(values.cognitoUserPoolId, 'us-east-1_XXXXXXXXX');
    }
    if (values.graphqlApiId) {
      content = content.replaceAll(values.graphqlApiId, 'xxxxxxxxxxxxxxxxxxxxxxxxxx');
    }
    if (values.apiKey) {
      content = content.replaceAll(values.apiKey, 'da2-fakeapikey00000000000000');
    }

    fs.writeFileSync(file, content, 'utf-8');
  }
}

main();
