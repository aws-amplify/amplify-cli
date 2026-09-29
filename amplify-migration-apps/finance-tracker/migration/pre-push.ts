#!/usr/bin/env npx ts-node
/**
 * Pre-push script for finance-tracker app.
 *
 * Applies manual edits required before `amplify push` on Gen1:
 * 1. Add customfinance dependency to function-parameters.json
 * 2. Add customfinance dependency to backend-config.json (function)
 * 3. Add customresolver dependency on API to backend-config.json
 * 4. Add CloudFormation parameters and env vars for SNS topic ARNs
 */

import fs from 'fs';
import path from 'path';

function resolveFunctionName(appPath: string): string {
  const functionDir = path.join(appPath, 'amplify', 'backend', 'function');
  const entries = fs.readdirSync(functionDir);
  const fnDir = entries.find((e) => e.startsWith('financetracker'));
  if (!fnDir) {
    throw new Error(`No financetracker function found in ${functionDir}`);
  }
  return fnDir;
}

function resolveApiName(appPath: string): string {
  const apiDir = path.join(appPath, 'amplify', 'backend', 'api');
  const entries = fs.readdirSync(apiDir);
  const api = entries.find((e) => e.startsWith('financetracker'));
  if (!api) {
    throw new Error(`No financetracker API found in ${apiDir}`);
  }
  return api;
}

/** Add customfinance dependency to function-parameters.json. */
function updateFunctionParameters(appPath: string, functionName: string): void {
  const filePath = path.join(
    appPath, 'amplify', 'backend', 'function', functionName, 'function-parameters.json',
  );

  const params = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    : {};

  params.lambdaLayers ??= [];
  params.dependsOn ??= [];

  const hasCustomfinance = params.dependsOn.some(
    (d: { resourceName?: string }) => d.resourceName === 'customfinance',
  );

  if (!hasCustomfinance) {
    params.dependsOn.push({
      category: 'custom',
      resourceName: 'customfinance',
      attributes: ['BudgetAlertTopicArn', 'MonthlyReportTopicArn'],
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(params, null, 2), 'utf-8');
}

/** Add customfinance dependency to the function entry in backend-config.json. */
function updateBackendConfigFunction(
  backendConfig: Record<string, unknown>,
  functionName: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const funcConfig = (backendConfig as any).function?.[functionName];
  if (!funcConfig) return;

  funcConfig.dependsOn ??= [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deps = funcConfig.dependsOn as any[];

  const hasCustomfinance = deps.some((d) => d.resourceName === 'customfinance');
  if (!hasCustomfinance) {
    deps.push({
      category: 'custom',
      resourceName: 'customfinance',
      attributes: ['BudgetAlertTopicArn', 'MonthlyReportTopicArn'],
    });
  }
}

/** Add customresolver entry with API dependency to backend-config.json. */
function updateBackendConfigCustomResolver(
  backendConfig: Record<string, unknown>,
  apiName: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const custom = ((backendConfig as any).custom ??= {});

  if (!custom.customresolver) {
    custom.customresolver = {
      dependsOn: [
        {
          attributes: ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput', 'GraphQLAPIKeyOutput'],
          category: 'api',
          resourceName: apiName,
        },
      ],
      providerPlugin: 'awscloudformation',
      service: 'customCDK',
    };
  }
}

/** Add CloudFormation parameters and env vars for SNS topic ARNs. */
function updateCloudFormationTemplate(appPath: string, functionName: string): void {
  const templatePath = path.join(
    appPath, 'amplify', 'backend', 'function', functionName,
    `${functionName}-cloudformation-template.json`,
  );

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  // Add parameters
  template.Parameters.customcustomfinanceBudgetAlertTopicArn ??= { Type: 'String' };
  template.Parameters.customcustomfinanceMonthlyReportTopicArn ??= { Type: 'String' };
  template.Parameters.dependsOn ??= { Type: 'String', Default: '' };
  template.Parameters.lambdaLayers ??= { Type: 'String', Default: '' };

  // Add environment variables
  const envVars = template.Resources.LambdaFunction.Properties.Environment.Variables;
  envVars.BUDGET_ALERT_TOPIC_ARN ??= { Ref: 'customcustomfinanceBudgetAlertTopicArn' };
  envVars.MONTHLY_REPORT_TOPIC_ARN ??= { Ref: 'customcustomfinanceMonthlyReportTopicArn' };

  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf-8');
}

export function prePush(appPath: string): void {
  const functionName = resolveFunctionName(appPath);
  const apiName = resolveApiName(appPath);

  // 1. Update function-parameters.json
  updateFunctionParameters(appPath, functionName);

  // 2-3. Update backend-config.json
  const backendConfigPath = path.join(appPath, 'amplify', 'backend', 'backend-config.json');
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigPath, 'utf-8'));
  updateBackendConfigFunction(backendConfig, functionName);
  updateBackendConfigCustomResolver(backendConfig, apiName);
  fs.writeFileSync(backendConfigPath, JSON.stringify(backendConfig, null, 2), 'utf-8');

  // 4. Update CloudFormation template
  updateCloudFormationTemplate(appPath, functionName);
}

function main(): void {
  const [appPath = process.cwd()] = process.argv.slice(2);
  prePush(appPath);
}

main();
