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
 * Strategy:
 * 1. Extract sensitive values from known reliable sources (team-provider-info.json)
 * 2. Replace ALL occurrences of those values across all files
 *
 * Targets:
 * - AWS Account IDs (12-digit numbers extracted from ARNs)
 * - AppSync API Keys (da2-* format)
 * - Amplify App IDs
 */

interface SensitiveValues {
  accountIds: Set<string>;
  apiKeys: Set<string>;
  amplifyAppIds: Set<string>;
}

function extractSensitiveValues(content: string): SensitiveValues {
  const values: SensitiveValues = {
    accountIds: new Set(),
    apiKeys: new Set(),
    amplifyAppIds: new Set(),
  };

  // Extract AWS Account IDs from ARNs (12-digit numbers)
  const arnPattern = /arn:aws:[^:]+:[^:]*:(\d{12}):/g;
  let match;
  while ((match = arnPattern.exec(content)) !== null) {
    values.accountIds.add(match[1]);
  }

  // Extract AppSync API Keys (da2-* format)
  const apiKeyPattern = /da2-[a-z0-9]{26}/g;
  while ((match = apiKeyPattern.exec(content)) !== null) {
    values.apiKeys.add(match[0]);
  }

  // Extract Amplify App IDs from JSON key
  const amplifyAppIdPattern = /"AmplifyAppId":\s*"([a-z0-9]+)"/g;
  while ((match = amplifyAppIdPattern.exec(content)) !== null) {
    values.amplifyAppIds.add(match[1]);
  }

  return values;
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

  // Phase 1: Extract all sensitive values from all files
  const allValues: SensitiveValues = {
    accountIds: new Set(),
    apiKeys: new Set(),
    amplifyAppIds: new Set(),
  };

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const values = extractSensitiveValues(content);
    values.accountIds.forEach((v) => allValues.accountIds.add(v));
    values.apiKeys.forEach((v) => allValues.apiKeys.add(v));
    values.amplifyAppIds.forEach((v) => allValues.amplifyAppIds.add(v));
  }

  console.log('Sensitive values found:');
  console.log(`  - AWS Account IDs: ${[...allValues.accountIds].join(', ') || 'none'}`);
  console.log(`  - AppSync API Keys: ${[...allValues.apiKeys].join(', ') || 'none'}`);
  console.log(`  - Amplify App IDs: ${[...allValues.amplifyAppIds].join(', ') || 'none'}`);
  console.log('');

  // Phase 2: Replace all occurrences in all files
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;
    const changes: string[] = [];

    // Replace account IDs
    for (const accountId of allValues.accountIds) {
      if (content.includes(accountId)) {
        content = content.split(accountId).join('123456789012');
        changes.push(`AWS Account ID: ${accountId} -> 123456789012`);
      }
    }

    // Replace API keys
    for (const apiKey of allValues.apiKeys) {
      if (content.includes(apiKey)) {
        content = content.split(apiKey).join('da2-fakeapikey00000000000000');
        changes.push(`AppSync API Key: ${apiKey} -> da2-fakeapikey00000000000000`);
      }
    }

    // Replace Amplify App IDs
    for (const appId of allValues.amplifyAppIds) {
      if (content.includes(appId)) {
        content = content.split(appId).join('xxxxxxxxxxxxx');
        changes.push(`Amplify App ID: ${appId} -> xxxxxxxxxxxxx`);
      }
    }

    if (content !== originalContent) {
      const relativePath = path.relative(__dirname, file);
      console.log(`${relativePath}:`);
      for (const change of changes) {
        console.log(`  - ${change}`);
      }
      fs.writeFileSync(file, content, 'utf-8');
      totalReplacements += changes.length;
      filesModified++;
    }
  }

  console.log(`\nSanitization complete. ${totalReplacements} replacements in ${filesModified} files.`);
}

main();
