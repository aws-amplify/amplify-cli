#!/usr/bin/env npx ts-node
/**
 * Post-generate script for fitness-tracker app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert lognutrition function from CommonJS to ESM
 * 3. Convert admin function from CommonJS to ESM
 * 4. Convert PreSignup trigger function from CommonJS to ESM
 * 5. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = 'sandbox';

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertExpressFunctionToESM(appPath: string, functionName: string): Promise<void> {
  const functionDir = path.join(appPath, 'amplify', 'function', functionName);

  // Convert index.js
  const indexPath = path.join(functionDir, 'index.js');
  let indexContent = await fs.readFile(indexPath, 'utf-8');

  // const X = require('Y') → import X from 'Y'
  // For relative paths without extension, append .js for ESM resolution
  indexContent = indexContent.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (_match, name, mod) => {
      const specifier = mod.startsWith('./') && !path.extname(mod) ? `${mod}.js` : mod;
      return `import ${name} from '${specifier}';`;
    },
  );

  // const { A, B } = require('Y') → import { A, B } from 'Y'
  indexContent = indexContent.replace(
    /const\s+(\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import $1 from '$2';",
  );

  // exports.handler = (event, context) => { → export async function handler(event, context) {
  indexContent = indexContent.replace(
    /exports\.handler\s*=\s*(?:async\s*)?\((\w+(?:,\s*\w+)*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(indexPath, indexContent, 'utf-8');

  // Convert app.js
  const appJsPath = path.join(functionDir, 'app.js');
  let appContent = await fs.readFile(appJsPath, 'utf-8');

  // const { A, B } = require('Y') → import { A, B } from 'Y'
  appContent = appContent.replace(
    /const\s+(\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import $1 from '$2';",
  );

  // const X = require('Y') → import X from 'Y'
  appContent = appContent.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import $1 from '$2';",
  );

  // module.exports = X → export default X
  appContent = appContent.replace(
    /module\.exports\s*=\s*(\w+);?/g,
    'export default $1;',
  );

  await fs.writeFile(appJsPath, appContent, 'utf-8');
}

async function convertPreSignupToESM(appPath: string): Promise<void> {
  // The PreSignup function name contains a hash that varies per deployment.
  // Use a glob to find it under amplify/auth/.
  const matches = await glob('amplify/auth/fitnesstracker*PreSignup', { cwd: appPath });
  const preSignupDir = path.join(appPath, matches[0]);

  // Convert index.js
  const indexPath = path.join(preSignupDir, 'index.js');
  let indexContent = await fs.readFile(indexPath, 'utf-8');

  // Replace dynamic require with static import
  indexContent = indexContent.replace(
    /const modules = moduleNames\.map\(\(name\) => require\(`\.\/\$\{name\}`\)\);/,
    "const modules = [await import('./email-filter-allowlist.js')];",
  );

  // exports.handler = async (event, context) => { → export async function handler(event, context) {
  indexContent = indexContent.replace(
    /exports\.handler\s*=\s*async\s*\((\w+(?:,\s*\w+)*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(indexPath, indexContent, 'utf-8');

  // Convert email-filter-allowlist.js
  const allowlistPath = path.join(preSignupDir, 'email-filter-allowlist.js');
  let allowlistContent = await fs.readFile(allowlistPath, 'utf-8');

  // exports.handler = async (event) => { → export async function handler(event) {
  allowlistContent = allowlistContent.replace(
    /exports\.handler\s*=\s*async\s*\((\w+)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(allowlistPath, allowlistContent, 'utf-8');
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

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertExpressFunctionToESM(appPath, 'lognutrition');
  await convertExpressFunctionToESM(appPath, 'admin');
  await convertPreSignupToESM(appPath);
  await updateFrontendConfig(appPath);
}

async function main(): Promise<void> {
  const [appPath] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
