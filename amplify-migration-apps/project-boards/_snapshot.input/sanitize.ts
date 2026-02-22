#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AMPLIFY_DIR = path.join(__dirname, 'amplify');

/**
 * Sanitizes sensitive values in Amplify project files for safe public commit.
 *
 * Targets:
 * - AWS Account IDs (12-digit numbers in ARNs)
 * - AppSync API Keys (da2-* format)
 * - Cognito User Pool IDs
 * - Cognito App Client IDs
 * - Cognito Identity Pool IDs
 * - Amplify App IDs
 */

function sanitizeContent(content: string): { sanitized: string; changes: string[] } {
  let sanitized = content;
  const changes: string[] = [];

  // AWS Account IDs in ARNs (12-digit numbers preceded by colons in ARN context)
  const accountIdPattern = /(arn:aws:[^:]+:[^:]*:)(\d{12})(:|\/)/g;
  sanitized = sanitized.replace(accountIdPattern, (match, prefix, accountId, suffix) => {
    if (accountId !== '123456789012') {
      changes.push(`AWS Account ID: ${accountId} -> 123456789012`);
    }
    return `${prefix}123456789012${suffix}`;
  });

  // AppSync API Keys (da2-* format, 26 chars after prefix)
  const apiKeyPattern = /da2-[a-z0-9]{26}/g;
  const apiKeyMatches = sanitized.match(apiKeyPattern);
  if (apiKeyMatches) {
    for (const match of [...new Set(apiKeyMatches)]) {
      if (match !== 'da2-fakeapikey00000000000000') {
        changes.push(`AppSync API Key: ${match} -> da2-fakeapikey00000000000000`);
      }
    }
    sanitized = sanitized.replace(apiKeyPattern, 'da2-fakeapikey00000000000000');
  }

  // Cognito User Pool IDs (us-east-1_XXXXXXXXX format)
  const userPoolPattern = /(us-east-1_)([A-Za-z0-9]{9})/g;
  sanitized = sanitized.replace(userPoolPattern, (match, prefix, poolId) => {
    if (poolId !== 'XXXXXXXXX') {
      changes.push(`Cognito User Pool ID: ${match} -> ${prefix}XXXXXXXXX`);
    }
    return `${prefix}XXXXXXXXX`;
  });

  // Cognito Identity Pool IDs (us-east-1:uuid format)
  const identityPoolPattern = /(us-east-1:)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g;
  sanitized = sanitized.replace(identityPoolPattern, (match, prefix, uuid) => {
    if (uuid !== '00000000-0000-0000-0000-000000000000') {
      changes.push(`Cognito Identity Pool ID: ${match} -> ${prefix}00000000-0000-0000-0000-000000000000`);
    }
    return `${prefix}00000000-0000-0000-0000-000000000000`;
  });

  // Cognito App Client IDs (in specific JSON keys)
  const appClientWebPattern = /("AppClientIDWeb":\s*")([a-z0-9]{26})(")/g;
  sanitized = sanitized.replace(appClientWebPattern, (match, prefix, clientId, suffix) => {
    if (clientId !== 'xxxxxxxxxxxxxxxxxxxxxxxxxx') {
      changes.push(`Cognito App Client ID (Web): ${clientId} -> xxxxxxxxxxxxxxxxxxxxxxxxxx`);
    }
    return `${prefix}xxxxxxxxxxxxxxxxxxxxxxxxxx${suffix}`;
  });

  const appClientPattern = /("AppClientID":\s*")([a-z0-9]{26})(")/g;
  sanitized = sanitized.replace(appClientPattern, (match, prefix, clientId, suffix) => {
    if (clientId !== 'xxxxxxxxxxxxxxxxxxxxxxxxxx') {
      changes.push(`Cognito App Client ID: ${clientId} -> xxxxxxxxxxxxxxxxxxxxxxxxxx`);
    }
    return `${prefix}xxxxxxxxxxxxxxxxxxxxxxxxxx${suffix}`;
  });

  // GraphQL API ID
  const graphqlApiIdPattern = /("GraphQLAPIIdOutput":\s*")([a-z0-9]{26})(")/g;
  sanitized = sanitized.replace(graphqlApiIdPattern, (match, prefix, apiId, suffix) => {
    if (apiId !== 'xxxxxxxxxxxxxxxxxxxxxxxxxx') {
      changes.push(`GraphQL API ID: ${apiId} -> xxxxxxxxxxxxxxxxxxxxxxxxxx`);
    }
    return `${prefix}xxxxxxxxxxxxxxxxxxxxxxxxxx${suffix}`;
  });

  // GraphQL Endpoint URL (sanitize the subdomain)
  const graphqlEndpointPattern = /(https:\/\/)([a-z0-9]{26})(\.appsync-api\.)/g;
  sanitized = sanitized.replace(graphqlEndpointPattern, (match, prefix, subdomain, suffix) => {
    if (subdomain !== 'xxxxxxxxxxxxxxxxxxxxxxxxxx') {
      changes.push(`GraphQL Endpoint subdomain: ${subdomain} -> xxxxxxxxxxxxxxxxxxxxxxxxxx`);
    }
    return `${prefix}xxxxxxxxxxxxxxxxxxxxxxxxxx${suffix}`;
  });

  // Amplify App ID
  const amplifyAppIdPattern = /("AmplifyAppId":\s*")([a-z0-9]{13})(")/g;
  sanitized = sanitized.replace(amplifyAppIdPattern, (match, prefix, appId, suffix) => {
    if (appId !== 'xxxxxxxxxxxxx') {
      changes.push(`Amplify App ID: ${appId} -> xxxxxxxxxxxxx`);
    }
    return `${prefix}xxxxxxxxxxxxx${suffix}`;
  });

  // CloudFormation Stack ID UUID (in StackId ARNs)
  const stackIdPattern = /(stack\/[^/]+\/)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g;
  sanitized = sanitized.replace(stackIdPattern, (match, prefix, uuid) => {
    if (uuid !== '00000000-0000-0000-0000-000000000000') {
      changes.push(`CloudFormation Stack UUID: ${uuid} -> 00000000-0000-0000-0000-000000000000`);
    }
    return `${prefix}00000000-0000-0000-0000-000000000000`;
  });

  return { sanitized, changes: [...new Set(changes)] };
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.state'))) {
      files.push(fullPath);
    }
  }

  return files;
}

function main(): void {
  console.log(`Scanning directory: ${AMPLIFY_DIR}\n`);

  const files = getAllFiles(AMPLIFY_DIR);
  let totalChanges = 0;
  let filesModified = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const { sanitized, changes } = sanitizeContent(content);

    if (changes.length > 0) {
      const relativePath = path.relative(__dirname, file);
      console.log(`${relativePath}:`);
      for (const change of changes) {
        console.log(`  - ${change}`);
      }
      fs.writeFileSync(file, sanitized, 'utf-8');
      totalChanges += changes.length;
      filesModified++;
    }
  }

  console.log(`\nSanitization complete. ${totalChanges} unique values replaced in ${filesModified} files.`);
}

main();
