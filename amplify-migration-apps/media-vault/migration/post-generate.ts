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
 * 7. Update auth/resource.ts callback/logout URLs for the gen2 branch
 * 8. Move branchName declaration in backend.ts and update callback/logout URLs
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

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertFunctionToESM(appPath: string, functionDir: string, functionName: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', functionDir, functionName, 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(
    /from\s*["']\.\/amplifyconfiguration\.json["']/g,
    "from '../amplify_outputs.json'",
  );

  await fs.writeFile(mainPath, updated, 'utf-8');
}

async function addResourceGroupName(appPath: string, functionPath: string, groupName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', functionPath, 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  if (content.includes('resourceGroupName')) return;

  const updated = content.replace(
    /(entry:\s*["'][^"']+["'],?)/,
    `$1\n  resourceGroupName: '${groupName}',`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function updateAuthCallbackUrls(appPath: string, branchName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'auth', 'resource.ts');
  let content = await fs.readFile(resourcePath, 'utf-8');

  // Add branchName variable if not present
  if (!content.includes('const branchName')) {
    content = `const branchName = process.env.AWS_BRANCH ?? "sandbox";\n\n${content}`;
  }

  // Add branch-specific callback/logout URLs
  content = content.replace(
    /(callbackUrls:\s*\[)([^\]]+)(\])/g,
    (match, open, urls, close) => {
      if (match.includes('branchName')) return match;
      const trimmed = urls.trim().replace(/,\s*$/, '');
      return `${open}${trimmed}, \`https://\${branchName}.d1086iitvfyy6.amplifyapp.com/\`${close}`;
    },
  );

  content = content.replace(
    /(logoutUrls:\s*\[)([^\]]+)(\])/g,
    (match, open, urls, close) => {
      if (match.includes('branchName')) return match;
      const trimmed = urls.trim().replace(/,\s*$/, '');
      return `${open}${trimmed}, \`https://\${branchName}.d1086iitvfyy6.amplifyapp.com/\`${close}`;
    },
  );

  await fs.writeFile(resourcePath, content, 'utf-8');
}

async function updateBackendCallbackUrls(appPath: string, branchName: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  // Move branchName declaration to the top if it exists later in the file
  const branchNameRegex = /const branchName = process\.env\.AWS_BRANCH \?\? "sandbox";\n?/;
  if (branchNameRegex.test(content)) {
    content = content.replace(branchNameRegex, '');
    // Add it near the top, after imports
    const lastImportIdx = content.lastIndexOf('import ');
    const lineEnd = content.indexOf('\n', lastImportIdx);
    content = content.slice(0, lineEnd + 1) + '\nconst branchName = process.env.AWS_BRANCH ?? "sandbox";\n' + content.slice(lineEnd + 1);
  }

  // Add branch-specific callback/logout URLs
  content = content.replace(
    /(callbackUrls:\s*\[)([^\]]+)(\])/g,
    (match, open, urls, close) => {
      if (match.includes('branchName')) return match;
      const trimmed = urls.trim().replace(/,\s*$/, '');
      return `${open}${trimmed}, \`https://\${branchName}.d1086iitvfyy6.amplifyapp.com/\`${close}`;
    },
  );

  content = content.replace(
    /(logoutUrls:\s*\[)([^\]]+)(\])/g,
    (match, open, urls, close) => {
      if (match.includes('branchName')) return match;
      const trimmed = urls.trim().replace(/,\s*$/, '');
      return `${open}${trimmed}, \`https://\${branchName}.d1086iitvfyy6.amplifyapp.com/\`${close}`;
    },
  );

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  const branchName = resolveTargetBranch();
  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'function', 'addusertogroup');
  await convertFunctionToESM(appPath, 'function', 'removeuserfromgroup');
  await convertFunctionToESM(appPath, 'storage', 'thumbnailgen');
  await updateFrontendConfig(appPath);
  await addResourceGroupName(appPath, 'storage/thumbnailgen', 'storage');
  await addResourceGroupName(appPath, 'function/addusertogroup', 'auth');
  await addResourceGroupName(appPath, 'function/removeuserfromgroup', 'auth');
  await updateAuthCallbackUrls(appPath, branchName);
  await updateBackendCallbackUrls(appPath, branchName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
