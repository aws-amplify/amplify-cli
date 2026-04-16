/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs';
import * as path from 'path';

interface SensitiveValues {
  accountId: string;
  amplifyAppId: string;
  gen1ApiKey: string | null;
  gen2ApiKey: string | null;
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

function extractGen1ApiKey(meta: any): string | null {
  if (!meta.api) return null;
  const firstApiResource = Object.keys(meta.api)[0];
  return meta.api[firstApiResource]?.output?.GraphQLAPIKeyOutput ?? null;
}

function extractGen2ApiKey(appDir: string): string | null {
  const preRefactor = path.join(appDir, '_snapshot.pre.refactor');
  for (const outputsFile of fs.readdirSync(preRefactor).filter((f) => f.endsWith('outputs.json'))) {
    const outputs = JSON.parse(fs.readFileSync(path.join(preRefactor, outputsFile), { encoding: 'utf-8' }));
    for (const output of outputs) {
      if (output.OutputKey.includes('ApiKey')) {
        return output.OutputValue;
      }
    }
  }
  return null;
}

function extractSensitiveValues(meta: any, appDir: string): SensitiveValues {
  return {
    accountId: extractAccountId(meta),
    amplifyAppId: extractAmplifyAppId(meta),
    gen1ApiKey: extractGen1ApiKey(meta),
    gen2ApiKey: extractGen2ApiKey(appDir),
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

/**
 * Sanitizes sensitive values in Amplify migration app snapshot files for safe public commit.
 *
 * Strategy:
 * 1. Extract sensitive values from _snapshot.pre.generate/amplify/backend/amplify-meta.json
 * 2. Replace all occurrences of those values across all _snapshot.* directories
 * 3. Rename files whose names contain the Amplify App ID
 *
 * Targets:
 * - AWS Account ID (from providers.awscloudformation AuthRoleArn) → replaced with 123456789012
 * - Amplify App ID (from providers.awscloudformation) → replaced with app name (dashes removed)
 * - Gen1 AppSync API Key (if present and starts with da2-) → replaced with da2-fakeapikey00000000000000
 * - Gen2 AppSync API Key (from .outputs.json, if present) → replaced with da2-fakeapikey00000000000000
 */
export function sanitize(appName: string, appDir: string): void {
  const appNameNoDashes = appName.replaceAll('-', '');
  const metaPath = path.join(appDir, '_snapshot.pre.generate', 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const values = extractSensitiveValues(amplifyMeta, appDir);

  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = [...snapshots.flatMap((s) => getFilesRecursive(path.join(appDir, s)))];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    content = content.replaceAll(values.accountId, '123456789012');
    content = content.replaceAll(values.amplifyAppId, appNameNoDashes);

    if (values.gen1ApiKey) {
      content = content.replaceAll(values.gen1ApiKey, 'da2-fakeapikey00000000000000');
    }

    if (values.gen2ApiKey) {
      content = content.replaceAll(values.gen2ApiKey, 'da2-fakeapikey00000000000000');
    }

    const sanitizedFileName = sanitizeFileName(file, values.amplifyAppId, appNameNoDashes);

    fs.writeFileSync(file, content.trimEnd() + '\n', 'utf-8');
    fs.renameSync(file, sanitizedFileName);
  }
}
