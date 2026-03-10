import { mockClient } from 'aws-sdk-client-mock';
import * as lambda from '@aws-sdk/client-lambda';
import { MigrationApp } from '../app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import path from 'path';
// import { FunctionEnvValueCfnResolver } from '../resolvers/function-env-value-cfn-resolver';

/**
 * Mock for the AWS Lambda service client (`@aws-sdk/client-lambda`).
 *
 * Mocks one command:
 *
 * - `GetFunctionCommand`: Returns the Lambda function configuration including
 *   runtime, timeout, memory size, and resolved environment variables.
 *
 * Environment variable resolution is the most complex part of this mock. In Gen1,
 * Lambda environment variables are defined in the function's CloudFormation template
 * at `Resources.LambdaFunction.Properties.Environment.Variables`. These values can be:
 *
 * 1. Concrete strings (e.g., `"us-east-1"`) — used as-is.
 * 2. Secret names listed in `function-parameters.json` `secretNames` — converted to
 *    SSM Parameter Store paths following the Amplify convention:
 *    `/amplify/<appId>/<envName>/AMPLIFY_<functionName>_<secretKey>`.
 * 3. CloudFormation intrinsics (e.g., `{ "Ref": "env" }`, `{ "Fn::GetAtt": [...] }`) —
 *    delegated to {@link FunctionEnvValueCfnResolver} which simulates CloudFormation's
 *    runtime resolution using local files.
 *
 * The function name follows the Amplify convention `<resourceName>-<envName>`, so
 * the mock splits on `-` to extract the resource name and locate the template.
 *
 * Source files:
 * - `function/<name>/<name>-cloudformation-template.json`: Runtime, timeout, env vars
 * - `function/<name>/function-parameters.json`: Secret names
 * - `amplify-meta.json`: App ID, environment name (for SSM paths)
 * - Root stack template: Parameter values passed to the function's nested stack
 *   (used by `FunctionEnvValueCfnResolver`)
 */
export class LambdaMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(lambda.LambdaClient);
    this.mockGetFunction();
  }
  private mockGetFunction() {
    this.mock
      .on(lambda.GetFunctionCommand)
      .callsFake(async (input: lambda.GetFunctionCommandInput): Promise<lambda.GetFunctionCommandOutput> => {
        const resourceName = this.app.resourceName({
          category: 'function',
          service: 'Lambda',
          outputKey: 'Name',
          outputValue: input.FunctionName!,
        });
        const stackName = this.app.clients.cloudformation.stackNameForResource(input.FunctionName!);
        const templatePath = this.app.templatePathForStack(stackName);
        const template = JSONUtilities.readJson<any>(templatePath);
        const envVariables = template.Resources.LambdaFunction.Properties.Environment.Variables;

        const parameters = JSONUtilities.readJson<Record<string, unknown>>(
          path.join(this.app.ccbPath, 'function', resourceName, 'function-parameters.json'),
        );
        const secrets = (parameters?.secretNames ?? []) as string[];
        // const cfnResolver = new FunctionEnvValueCfnResolver(this.app, input.FunctionName!);

        for (const key of Object.keys(envVariables)) {
          const value = envVariables[key];

          // Secrets are stored in SSM Parameter Store, not in the CFN template.
          if (secrets.includes(key)) {
            envVariables[key] = `/amplify/${this.app.id}/${this.app.environmentName}/AMPLIFY_${resourceName}_${key}`;
            continue;
          }

          // Already a concrete string — nothing to resolve.
          if (typeof value === 'string') {
            continue;
          }

          // CloudFormation intrinsic — delegate to the resolver.
          if (typeof value === 'object' && 'Ref' in value) {
            switch (value['Ref']) {
              case 'AWS::Region':
                envVariables[key] = this.app.region;
                break;
              default:
                envVariables[key] = this.app.cfnParameterForStack(stackName, value['Ref']);
                break;
            }
            continue;
          }

          if (typeof value === 'object' && ('Fn::ImportValue' in value || 'Fn::Join' in value)) {
            // we don't care about the value here because codegen should generate
            // a dynamic reference to this env variable, so the concrete value should
            // never appear in the gen2 app.
            envVariables[key] = '<dynamically-referenced>';
            continue;
          }

          throw new Error(`Unexpected environment variable value for '${key}' in function '${resourceName}': ${value}`);
        }

        return {
          Configuration: {
            FunctionName: input.FunctionName,
            Runtime: template.Resources.LambdaFunction.Properties.Runtime,
            Timeout: template.Resources.LambdaFunction.Properties.Timeout,
            MemorySize: 128,
            Environment: {
              Variables: envVariables,
            },
          },
          $metadata: {},
        };
      });
  }
}
