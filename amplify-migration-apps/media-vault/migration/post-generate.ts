#!/usr/bin/env npx ts-node
/**
 * Post-generate script for media-vault app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert addusertogroup function from CommonJS to ESM
 * 3. Convert removeuserfromgroup function from CommonJS to ESM
 * 4. Convert thumbnailgen function from CommonJS to ESM
 * 5. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 6. Add resourceGroupName to function resource.ts files
 * 7. Monkey-patch auth resource so secret() uses local plaintext values (skipped when SKIP_AUTH_SECRET_PATCH=1 — use this when deploying from your own machine with real secrets configured in Parameter Store / Secrets Manager)
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

function resolveTargetBranch(): string {
  if (process.env.AWS_BRANCH) {
    return process.env.AWS_BRANCH;
  }
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = resolveTargetBranch();

  const updated = content.replace(/branchName:\s*['"]([^'"]+)['"]/, `branchName: '${targetBranch}'`);

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertFunctionToESM(appPath: string, functionDir: string, functionName: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', functionDir, functionName, 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(/exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  updated = updated.replace(/module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(/from\s*["']\.\/amplifyconfiguration\.json["']/g, "from '../amplify_outputs.json'");

  await fs.writeFile(mainPath, updated, 'utf-8');
}

async function addResourceGroupName(appPath: string, functionPath: string, groupName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', functionPath, 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  if (content.includes('resourceGroupName')) return;

  const updated = content.replace(/(entry:\s*["'][^"']+["'],?)/, `$1\n  resourceGroupName: '${groupName}',`);

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

/**
 * Replaces the imported `secret()` in auth/resource.ts with a local
 * implementation backed by `SecretValue.unsafePlainText` so the app
 * can be deployed without real secrets.
 */
async function monkeyPatchAuthSecret(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'auth', 'resource.ts');
  let content = await fs.readFile(resourcePath, 'utf-8');

  // Remove `secret` from the @aws-amplify/backend import
  content = content.replace(/import\s*\{([^}]*)\bsecret\b([^}]*)\}\s*from\s*['"]@aws-amplify\/backend['"]/, (_, before, after) => {
    const remaining = [before, after]
      .join('')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
    return `import { ${remaining} } from '@aws-amplify/backend'`;
  });

  // Add SecretValue import and local secret() definition after the last import
  const localSecret = [
    '',
    "import { SecretValue } from 'aws-cdk-lib';",
    '',
    'const secret = (name: string) => ({',
    '  resolve: () => SecretValue.unsafePlainText(`local-${name}`),',
    '  resolvePath: () => ({',
    '    branchSecretPath: `local/${name}`,',
    '    sharedSecretPath: `local/shared/${name}`,',
    '  }),',
    '});',
  ].join('\n');

  // Insert after the last import statement
  const importRegex = /^import\s.+;$/gm;
  let lastImportEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    lastImportEnd = match.index + match[0].length;
  }
  content = content.slice(0, lastImportEnd) + localSecret + content.slice(lastImportEnd);

  await fs.writeFile(resourcePath, content, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'function', 'addusertogroup');
  await convertFunctionToESM(appPath, 'function', 'removeuserfromgroup');
  await convertFunctionToESM(appPath, 'function', 'thumbnailgen');
  await updateFrontendConfig(appPath);
  await addResourceGroupName(appPath, 'function/thumbnailgen', 'storage');
  await addResourceGroupName(appPath, 'function/addusertogroup', 'auth');
  await addResourceGroupName(appPath, 'function/removeuserfromgroup', 'auth');
  if (!process.env.SKIP_AUTH_SECRET_PATCH) {
    await monkeyPatchAuthSecret(appPath);
  }
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
