/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface SensitiveValues {
  accountId: string;
  amplifyAppId: string;
  gen1ApiKey: string | null;
}

function extractAccountId(meta: any): string {
  const authRoleArn = meta.providers.awscloudformation.AuthRoleArn;
  const arnMatch = authRoleArn.match(/arn:aws:iam::(\d{12}):/);
  if (!arnMatch) {
    return '123456789012';
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

/**
 * Extracts all string output values from the amplify-meta.json, paired with
 * a sanitized placeholder of the form `<category>.<resourceName>.<outputKey>`.
 *
 * Only includes outputs whose key matches a known varying-value pattern
 * (pool IDs, client IDs, API keys, bucket names, Lambda ARNs, etc.).
 * Static config values like Region, mfaConfiguration, etc. are left untouched.
 */
const SENSITIVE_OUTPUT_KEY_PATTERNS = [
  'UserPool',
  'UserRole',
  'AppClient',
  'IdentityPool',
  'GraphQLAPI',
  'ApiKey',
  'ApiId',
  'ApiEndpoint',
  'Bucket',
  'LambdaExecution',
  'TableName',
  'TableStreamArn',
  'TableArn',
  'SchemaS3Uri',
  'webClientId',
  'oauthClientId',
  'userPoolId',
  'identityPoolId',
  'bucketName',
  'buckets',
];

/** Returns true if the output key matches a known varying-value pattern. */
function isSensitiveOutputKey(key: string): boolean {
  return SENSITIVE_OUTPUT_KEY_PATTERNS.some((pattern) => key.includes(pattern));
}

/**
 * Extracts replacements from all .outputs.json files in _snapshot.pre.refactor.
 *
 * Each output value is replaced with `<hash>.<OutputKey>` where `<hash>` is a
 * stable 10-character hex digest derived from the outputs filename.
 * Only includes outputs whose key matches a known varying-value pattern.
 */
function extractOutputReplacements(appDir: string): { value: string; placeholder: string }[] {
  const preRefactor = path.join(appDir, '_snapshot.pre.refactor');
  if (!fs.existsSync(preRefactor)) return [];

  const replacements: { value: string; placeholder: string }[] = [];

  for (const fileName of fs
    .readdirSync(preRefactor)
    .sort()
    .filter((f) => f.endsWith('.outputs.json'))) {
    const hash = crypto.createHash('sha256').update(fileName).digest('hex').slice(0, 10);
    const outputs: any[] = JSON.parse(fs.readFileSync(path.join(preRefactor, fileName), { encoding: 'utf-8' }));
    for (const output of outputs) {
      if (!isSensitiveOutputKey(output.OutputKey as string)) continue;
      const outputValue: unknown = output.OutputValue;
      if (replacements.find((r) => r.value === outputValue)) continue;
      replacements.push({ value: outputValue as string, placeholder: `${hash}.${output.OutputKey}` });
    }
  }

  replacements.sort((a, b) => b.value.length - a.value.length);
  return replacements;
}

function extractSensitiveValues(meta: any): SensitiveValues {
  return {
    accountId: extractAccountId(meta),
    amplifyAppId: extractAmplifyAppId(meta),
    gen1ApiKey: extractGen1ApiKey(meta),
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
 * - Sensitive output values from .outputs.json files → replaced with <fileHash>.<OutputKey>
 */
export function sanitize(appName: string, appDir: string): void {
  const appNameNoDashes = appName.replaceAll('-', '');
  const metaPath = path.join(appDir, '_snapshot.pre.generate', 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const values = extractSensitiveValues(amplifyMeta);

  const refactorOutputReplacements = extractOutputReplacements(appDir);

  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = [...snapshots.flatMap((s) => getFilesRecursive(path.join(appDir, s)))];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    for (const { value, placeholder } of refactorOutputReplacements) {
      content = content.replaceAll(value, placeholder);
    }

    content = content.replaceAll(values.accountId, '123456789012');
    content = content.replaceAll(values.amplifyAppId, appNameNoDashes);

    if (values.gen1ApiKey && values.gen1ApiKey.startsWith('da2-')) {
      content = content.replaceAll(values.gen1ApiKey, 'da2-fakeapikey00000000000000');
    }

    const sanitizedFileName = sanitizeFileName(file, values.amplifyAppId, appNameNoDashes);

    fs.writeFileSync(file, content, 'utf-8');
    fs.renameSync(file, sanitizedFileName);
  }
}
