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
import * as os from 'os';

interface SensitiveValues {
  accountId: string;
  amplifyAppId: string;
}

function extractAccountId(meta: any): string {
  const authRoleArn = meta.providers.awscloudformation.AuthRoleArn;
  const arnMatch = authRoleArn.match(/arn:aws:iam::(\d{12}):/);
  if (!arnMatch) {
    // Already sanitized — account ID is baked into the placeholder.
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

/**
 * Extracts all string output values from the amplify-meta.json, paired with
 * a sanitized placeholder of the form `<category>.<resourceName>.<outputKey>`.
 *
 * Skips non-string values (nested objects like authConfig), values that are
 * too short to safely replace via global string substitution, and AWS region
 * strings that appear as substrings throughout unrelated content.
 */
const AWS_REGION_PATTERN = /^[a-z]{2}(-[a-z]+-\d+)$/;

/** Values that are too generic to safely replace via global string substitution. */
const SKIP_VALUES = new Set(['sandbox', 'NONE', 'false', 'true']);

function extractOutputReplacements(meta: any): { value: string; placeholder: string }[] {
  const replacements: { value: string; placeholder: string }[] = [];

  for (const category of Object.keys(meta)) {
    if (category === 'providers') continue;
    if (typeof meta[category] !== 'object' || meta[category] === null) continue;
    for (const resourceName of Object.keys(meta[category])) {
      const output = meta[category][resourceName]?.output;
      if (!output || typeof output !== 'object') continue;
      for (const outputKey of Object.keys(output)) {
        const outputValue = output[outputKey];
        if (typeof outputValue !== 'string') continue;
        if (outputValue.length < 5) continue;
        if (AWS_REGION_PATTERN.test(outputValue)) continue;
        if (SKIP_VALUES.has(outputValue)) continue;
        replacements.push({ value: outputValue, placeholder: `${category}.${resourceName}.${outputKey}` });
      }
    }
  }

  // Sort by value length descending so longer strings are replaced first,
  // preventing partial matches when one value is a substring of another.
  replacements.sort((a, b) => b.value.length - a.value.length);
  return replacements;
}

/**
 * Extracts replacements from all .outputs.json files in _snapshot.pre.refactor.
 *
 * Each output value is replaced with `<hash>.<OutputKey>` where `<hash>` is a
 * stable 10-character hex digest derived from the outputs filename.
 */
function extractRefactorOutputReplacements(appDir: string): { value: string; placeholder: string }[] {
  const preRefactor = path.join(appDir, '_snapshot.pre.refactor');
  if (!fs.existsSync(preRefactor)) return [];

  const replacements: { value: string; placeholder: string }[] = [];

  for (const fileName of fs.readdirSync(preRefactor).filter((f) => f.endsWith('.outputs.json'))) {
    const hash = crypto.createHash('sha256').update(fileName).digest('hex').slice(0, 10);
    const outputs: any[] = JSON.parse(fs.readFileSync(path.join(preRefactor, fileName), { encoding: 'utf-8' }));
    for (const output of outputs) {
      const outputValue: unknown = output.OutputValue;
      if (typeof outputValue !== 'string') continue;
      if (outputValue.length < 5) continue;
      if (AWS_REGION_PATTERN.test(outputValue)) continue;
      if (SKIP_VALUES.has(outputValue)) continue;
      replacements.push({ value: outputValue, placeholder: `${hash}.${output.OutputKey}` });
    }
  }

  replacements.sort((a, b) => b.value.length - a.value.length);
  return replacements;
}

function extractSensitiveValues(meta: any): SensitiveValues {
  return {
    accountId: extractAccountId(meta),
    amplifyAppId: extractAmplifyAppId(meta),
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
  // sandbox uses this
  const username = os.userInfo().username;
  return name.replaceAll(appId, appName).replaceAll(`-${username}-`, '-username-');
}

function getAllFiles(dir: string): string[] {
  return getFilesRecursive(dir);
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
 * - All string output values from resource categories → replaced with <category>.<resourceName>.<outputKey>
 * - All string output values from .outputs.json files → replaced with <fileHash>.<OutputKey>
 */
export function sanitize(appName: string, appDir: string): void {
  const appNameNoDashes = appName.replaceAll('-', '');
  const metaPath = path.join(appDir, '_snapshot.pre.generate', 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const values = extractSensitiveValues(amplifyMeta);

  const outputReplacements = extractOutputReplacements(amplifyMeta);
  const refactorOutputReplacements = extractRefactorOutputReplacements(appDir);

  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = [...snapshots.flatMap((s) => getAllFiles(path.join(appDir, s)))];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    content = content.replaceAll(values.accountId, '123456789012');
    content = content.replaceAll(values.amplifyAppId, appNameNoDashes);

    for (const { value, placeholder } of outputReplacements) {
      content = content.replaceAll(value, placeholder);
    }

    for (const { value, placeholder } of refactorOutputReplacements) {
      content = content.replaceAll(value, placeholder);
    }

    const sanitizedFileName = sanitizeFileName(file, values.amplifyAppId, appNameNoDashes);

    fs.writeFileSync(file, content, 'utf-8');
    fs.renameSync(file, sanitizedFileName);
  }
}
