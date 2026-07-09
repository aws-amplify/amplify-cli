#!/usr/bin/env npx ts-node
/**
 * Post-generate script for fitness-tracker app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert lognutrition function from CommonJS to ESM
 * 3. Convert admin function from CommonJS to ESM
 * 4. Convert PreSignup trigger function from CommonJS to ESM
 * 5. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 6. Add resourceGroupName to function resource.ts files to break circular dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

function resolveTargetBranch(): string {
  if (process.env.AWS_BRANCH) {
    return process.env.AWS_BRANCH;
  }
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

async function findPreSignupDir(appPath: string): Promise<string> {
  const authDir = path.join(appPath, 'amplify', 'function');
  const entries = await fs.readdir(authDir);
  const match = entries.find((e) => e.startsWith('fitnesstracker') && e.includes('PreSignup'));
  if (!match) throw new Error('PreSignup directory not found under amplify/function/');
  return path.join(authDir, match);
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = resolveTargetBranch();

  const updated = content.replace(/branchName:\s*['"]([^'"]+)['"]/, `branchName: '${targetBranch}'`);

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertExpressFunctionToESM(appPath: string, functionName: string): Promise<void> {
  const functionDir = path.join(appPath, 'amplify', 'function', functionName);

  // Convert index.js
  const indexPath = path.join(functionDir, 'index.js');
  let indexContent = await fs.readFile(indexPath, 'utf-8');

  // const X = require('Y') → import X from 'Y'
  // For relative paths without extension, append .js for ESM resolution
  indexContent = indexContent.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, (_match, name, mod) => {
    const specifier = mod.startsWith('./') && !path.extname(mod) ? `${mod}.js` : mod;
    return `import ${name} from '${specifier}';`;
  });

  // const { A, B } = require('Y') → import { A, B } from 'Y'
  indexContent = indexContent.replace(/const\s+(\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2';");

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
  appContent = appContent.replace(/const\s+(\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2';");

  // const X = require('Y') → import X from 'Y'
  appContent = appContent.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2';");

  // module.exports = X → export default X
  appContent = appContent.replace(/module\.exports\s*=\s*(\w+);?/g, 'export default $1;');

  await fs.writeFile(appJsPath, appContent, 'utf-8');
}

async function convertPreSignupToESM(appPath: string): Promise<void> {
  // The PreSignup function name contains a hash that varies per deployment.
  const preSignupDir = await findPreSignupDir(appPath);

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
  allowlistContent = allowlistContent.replace(/exports\.handler\s*=\s*async\s*\((\w+)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  await fs.writeFile(allowlistPath, allowlistContent, 'utf-8');
}

async function updateFrontendConfig(appPath: string, branchName: string): Promise<void> {
  // Rewrite api-config.ts with Gen2 API names and parseAmplifyConfig-based configure function
  const apiConfigPath = path.join(appPath, 'src', 'api-config.ts');
  await fs.writeFile(
    apiConfigPath,
    `import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';

export const NUTRITION_API_NAME = 'nutritionapi-${branchName}';
export const ADMIN_API_NAME = 'adminapi-${branchName}';

export function configureAmplify(config: any): void {
  const amplifyConfig = parseAmplifyConfig(config);
  Amplify.configure({
    ...amplifyConfig,
    API: { ...amplifyConfig.API, REST: config.custom?.API },
  });
}
`,
    'utf-8',
  );

  // Update main.tsx: switch config import from amplifyconfiguration.json to amplify_outputs.json
  const mainPath = path.join(appPath, 'src', 'main.tsx');
  let mainContent = await fs.readFile(mainPath, 'utf-8');
  mainContent = mainContent.replace(/from\s*["']\.\/amplifyconfiguration\.json["']/g, "from '../amplify_outputs.json'");
  await fs.writeFile(mainPath, mainContent, 'utf-8');
}

async function setResourceGroupName(resourceTsPath: string, groupName: string): Promise<void> {
  const content = await fs.readFile(resourceTsPath, 'utf-8');

  // Add resourceGroupName after the entry property in defineFunction({ entry: "...", })
  const updated = content.replace(/(entry:\s*["'][^"']+["'],?)/, `$1\n  resourceGroupName: '${groupName}',`);

  await fs.writeFile(resourceTsPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  const branchName = execSync('git branch --show-current', { cwd: appPath, encoding: 'utf-8' }).trim();

  await updateBranchName(appPath);
  await convertExpressFunctionToESM(appPath, 'lognutrition');
  await convertExpressFunctionToESM(appPath, 'admin');
  await convertPreSignupToESM(appPath);
  await updateFrontendConfig(appPath, branchName);

  // Break circular dependencies by assigning functions to the stack of the resource they access
  await setResourceGroupName(path.join(appPath, 'amplify', 'function', 'lognutrition', 'resource.ts'), 'data');
  await setResourceGroupName(path.join(appPath, 'amplify', 'function', 'admin', 'resource.ts'), 'auth');
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
