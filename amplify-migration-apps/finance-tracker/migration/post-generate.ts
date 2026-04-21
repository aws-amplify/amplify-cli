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

  // Find the custom resource stack name (e.g. customfinance, financereport)
  // Pattern: new <ClassName>(backend.createStack('<stackName>'), '<stackName>')
  const customResMatch = content.match(
    /new\s+(\w+)\(\s*backend\.createStack\(\s*['"](\w*finance\w*)['"]\s*\)\s*,\s*['"]\2['"]/,
  );

  if (!customResMatch) {
    console.warn('Could not find custom finance resource instantiation in backend.ts');
    return;
  }

  const [fullMatch, , stackName] = customResMatch;

  // Capture the instance: new X(...) -> const stackName = new X(...)
  if (!content.includes(`const ${stackName} = ${fullMatch.split('(')[0]}`)) {
    content = content.replace(
      fullMatch,
      `const ${stackName} = ${fullMatch}`,
    );
  }

  const fnDir = resolveFunctionDir(appPath);
  const envBlock = `
// Wire SNS topic ARNs to Lambda environment variables
backend.${fnDir}.addEnvironment(
  'BUDGET_ALERT_TOPIC_ARN',
  ${stackName}.budgetAlertTopic.topicArn
);
backend.${fnDir}.addEnvironment(
  'MONTHLY_REPORT_TOPIC_ARN',
  ${stackName}.monthlyReportTopic.topicArn
);
`;

  content = content.trimEnd() + '\n' + envBlock;
  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertLambdaToESM(appPath);
  await updateFrontendConfig(appPath);
  await addSnsPublishPolicy(appPath);
  await wireSnsTopicEnvVars(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
