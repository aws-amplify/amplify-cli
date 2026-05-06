#!/usr/bin/env npx ts-node
/**
 * Post-generate script for finance-tracker app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts
 * 2. Convert Lambda function from CommonJS to ESM
 * 3. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 4. Add SNS publish IAM policy to backend.ts for the Lambda function
 * 5. Wire SNS topic ARNs as Lambda environment variables in backend.ts
 * 6. Fix custom resolver table name reference
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

function resolveTargetBranch(): string {
  if (process.env.AWS_BRANCH) {
    return process.env.AWS_BRANCH;
  }
  return execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf-8',
  }).trim();
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

/**
 * Find the Lambda function directory under amplify/function/.
 * The name includes a hash suffix that varies per init.
 */
function resolveFunctionDir(appPath: string): string {
  const functionRoot = path.join(appPath, 'amplify', 'function');
  const entries = fsSync.readdirSync(functionRoot);
  const fnDir = entries.find((e) => e.startsWith('financetracker'));
  if (!fnDir) {
    throw new Error(
      `No financetracker function found in ${functionRoot}`,
    );
  }
  return fnDir;
}

async function convertLambdaToESM(appPath: string): Promise<void> {
  const fnDir = resolveFunctionDir(appPath);
  const handlerPath = path.join(
    appPath, 'amplify', 'function', fnDir, 'index.js',
  );
  let content = await fs.readFile(handlerPath, 'utf-8');

  // Convert require() to import statements
  content = content.replace(
    /const\s*\{([^}]+)\}\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\);?/g,
    'import {$1} from \'$2\';',
  );

  // Convert exports.handler to export const handler
  content = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export const handler = async ($1) => {',
  );

  await fs.writeFile(handlerPath, content, 'utf-8');
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

async function addSnsPublishPolicy(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  if (content.includes('sns:Publish')) return;

  // Add PolicyStatement import if not present
  if (!content.includes('PolicyStatement')) {
    content = content.replace(
      /import\s*\{([^}]*)\bDuration\b([^}]*)\}\s*from\s*["']aws-cdk-lib["']/,
      (match, before, after) => {
        return `import {${before}Duration${after}} from "aws-cdk-lib";\nimport { PolicyStatement } from "aws-cdk-lib/aws-iam"`;
      },
    );
    // If no Duration import exists, add standalone
    if (!content.includes('PolicyStatement')) {
      content =
        'import { PolicyStatement } from "aws-cdk-lib/aws-iam";\n' +
        content;
    }
  }

  const fnDir = resolveFunctionDir(appPath);
  const policyBlock = `
// Grant Lambda SNS publish permission (replaces Gen1 custom-policies.json)
backend.${fnDir}.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:Publish'],
    resources: ['*'],
  })
);
`;

  content = content.trimEnd() + '\n' + policyBlock;
  await fs.writeFile(backendPath, content, 'utf-8');
}

/**
 * Capture the custom resource instance and pass SNS topic ARNs
 * as environment variables to the Lambda function.
 */
async function wireSnsTopicEnvVars(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  if (content.includes('BUDGET_ALERT_TOPIC_ARN')) return;

  // Find the custom resource define call (e.g. customfinance.defineCustomfinance(backend))
  // Pattern: <alias>.define<Name>(backend)
  const customResMatch = content.match(
    /(\w*finance\w*)\.define\w+\(backend\)/,
  );

  if (!customResMatch) {
    console.warn('Could not find custom finance resource define call in backend.ts');
    return;
  }

  const [fullMatch, stackName] = customResMatch;

  // Capture the instance with a prefixed name to avoid shadowing the namespace import
  const varName = `_${stackName}`;
  if (!content.includes(`const ${varName} =`)) {
    content = content.replace(
      fullMatch,
      `const ${varName} = ${fullMatch}`,
    );
  }

  const fnDir = resolveFunctionDir(appPath);
  const envBlock = `
// Wire SNS topic ARNs to Lambda environment variables
backend.${fnDir}.addEnvironment(
  'BUDGET_ALERT_TOPIC_ARN',
  ${varName}.budgetAlertTopic.topicArn
);
backend.${fnDir}.addEnvironment(
  'MONTHLY_REPORT_TOPIC_ARN',
  ${varName}.monthlyReportTopic.topicArn
);
`;

  content = content.trimEnd() + '\n' + envBlock;
  await fs.writeFile(backendPath, content, 'utf-8');
}

/**
 * Replace the Fn.sub table name construction in the custom resolver
 * with a direct reference to the Gen2 data resource table.
 */
async function fixCustomResolverTableName(appPath: string): Promise<void> {
  const customDir = path.join(appPath, 'amplify', 'custom');
  if (!fsSync.existsSync(customDir)) return;

  const entries = fsSync.readdirSync(customDir);
  const resolverDir = entries.find((e) => e.includes('resolver'));
  if (!resolverDir) return;

  const resourcePath = path.join(customDir, resolverDir, 'construct.ts');
  if (!fsSync.existsSync(resourcePath)) return;

  let content = await fs.readFile(resourcePath, 'utf-8');

  // Replace Fn.sub table name pattern with backend.data.resources.tables reference
  content = content.replace(
    /tableName:\s*cdk\.Fn\.sub\(\s*['"]Transaction-\$\{apiId\}-\$\{(?:env|branchName)\}['"]\s*,\s*\{[^}]+\}\s*\)/g,
    "tableName: backend.data.resources.tables['Transaction'].tableName",
  );

  await fs.writeFile(resourcePath, content, 'utf-8');
}

/**
 * Scan the Lambda function source for @aws-sdk/* imports/requires and
 * add them to the root package.json so esbuild can resolve them.
 */
async function addMissingSdkDeps(appPath: string): Promise<void> {
  const fnDir = resolveFunctionDir(appPath);
  const handlerPath = path.join(appPath, 'amplify', 'function', fnDir, 'index.js');
  const source = await fs.readFile(handlerPath, 'utf-8');

  const sdkPackages = new Set<string>();
  const patterns = [
    /require\(\s*['"](@aws-sdk\/[^'"]+)['"]\s*\)/g,
    /from\s+['"](@aws-sdk\/[^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const [, pkg] of source.matchAll(pattern)) {
      sdkPackages.add(pkg);
    }
  }

  if (sdkPackages.size === 0) return;

  const pkgPath = path.join(appPath, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  const deps: Record<string, string> = pkg.dependencies ?? {};

  for (const name of sdkPackages) {
    if (!deps[name]) {
      deps[name] = '*';
    }
  }

  pkg.dependencies = deps;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  execSync('npm install', { cwd: appPath, stdio: 'inherit' });
}

/**
 * Add @aws_api_key to the getTransactionsByCategory field and
 * TransactionConnection type so API key requests are authorized.
 * In Gen1 the custom VTL resolver bypassed schema-level auth;
 * Gen2 enforces it.
 */
async function addApiKeyAuthToCustomResolver(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');
  let content = await fs.readFile(resourcePath, 'utf-8');

  if (content.includes('@aws_api_key')) return;

  content = content.replace(
    'getTransactionsByCategory(category: String!, limit: Int): TransactionConnection',
    'getTransactionsByCategory(category: String!, limit: Int): TransactionConnection @aws_api_key',
  );

  content = content.replace(
    'type TransactionConnection {',
    'type TransactionConnection @aws_api_key {',
  );

  await fs.writeFile(resourcePath, content, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertLambdaToESM(appPath);
  await addMissingSdkDeps(appPath);
  await updateFrontendConfig(appPath);
  await addSnsPublishPolicy(appPath);
  await wireSnsTopicEnvVars(appPath);
  await fixCustomResolverTableName(appPath);
  await addApiKeyAuthToCustomResolver(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
