#!/usr/bin/env npx tsx

/**
 * Sanitizes sensitive values in Amplify migration app snapshot files for safe public commit.
 *
 * Usage: cd into an app directory under amplify-migration-apps/, then run:
 *   npx tsx ../sanitize.ts
 *
 * Strategy:
 * 1. Extract sensitive values from _snapshot.pre.generate/amplify/backend/amplify-meta.json
 * 2. Replace all occurrences of those values across all _snapshot.* directories
 * 3. Rename files whose names contain the Amplify App ID
 *
 * Targets:
 * - AWS Account ID (from providers.awscloudformation AuthRoleArn) → replaced with 123456789012
 * - Amplify App ID (from providers.awscloudformation) → replaced with app name (dashes removed)
 * - AppSync API Key (from api output, if present) → replaced with da2-fakeapikey00000000000000
 */

import * as fs from 'fs';
import * as path from 'path';

interface SensitiveValues {
  accountId: string;
  amplifyAppId: string;
  apiKey: string | null;
}

function extractAccountId(meta: any): string {
  const authRoleArn = meta.providers.awscloudformation.AuthRoleArn;
  const arnMatch = authRoleArn.match(/arn:aws:iam::(\d{12}):/);
  if (!arnMatch) {
    throw new Error('Could not extract AWS Account ID from AuthRoleArn');
  }
  return arnMatch[1];
}

function extractAmplifyAppId(meta: any): string {
  const appId = meta.providers.awscloudformation.AmplifyAppId;
  if (!appId) {
    throw new Error('Could not extract Amplify App ID from amplify-meta.json');
  }
  return appId;
}

function extractApiKey(meta: any): string | null {
  if (!meta.api) return null;
  const firstApiResource = Object.keys(meta.api)[0];
  return meta.api[firstApiResource]?.output?.GraphQLAPIKeyOutput ?? null;
}

function extractSensitiveValues(meta: any): SensitiveValues {
  return {
    accountId: extractAccountId(meta),
    amplifyAppId: extractAmplifyAppId(meta),
    apiKey: extractApiKey(meta),
  };
}

function getFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (fullPath.includes('node_modules')) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function sanitizeFileName(name: string, appId: string, appName: string): string {
  return name.replaceAll(appId, appName);
}

function getAllFiles(dir: string): string[] {
  return getFilesRecursive(dir);
}

function main(): void {

  const appName = path.basename(process.cwd());
  const appNameNoDashes = appName.replaceAll('-', '');

  const appDir = path.join(__dirname, appName);
  const metaPath = path.join(appDir, '_snapshot.pre.generate', 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const values = extractSensitiveValues(amplifyMeta);


  const snapshots = fs.readdirSync(appDir).filter(f => f.startsWith('_snapshot'));
  const files = [...snapshots.flatMap(s => getAllFiles(path.join(appDir, s)))];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    content = content.replaceAll(values.accountId, '123456789012');
    content = content.replaceAll(values.amplifyAppId, appNameNoDashes);

    if (values.apiKey) {
      content = content.replaceAll(values.apiKey, 'da2-fakeapikey00000000000000');
    }

    const sanitizedFileName = sanitizeFileName(file, values.amplifyAppId, appNameNoDashes);

    // ensure a single new line at the end of the file
    // since linters and IDEs will add them automatically
    // and cause false snapshot diffs.
    const trimmedContent = `${content.trim()}\n`;

    fs.writeFileSync(file, trimmedContent, 'utf-8');
    fs.renameSync(file, sanitizedFileName);
  }
}

main();
