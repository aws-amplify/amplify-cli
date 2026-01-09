import ts from 'typescript';
import { ObjectLiteralElementLike, VariableDeclaration, VariableStatement } from 'typescript';
import type { EnvironmentResponse } from '@aws-sdk/client-lambda';
import { Runtime } from '@aws-sdk/client-lambda';
import { renderResourceTsFile } from '../../resource/resource';
import { parseAuthAccessFromTemplate } from '../../codegen-head/auth_access_parser';
import assert from 'node:assert';

/**
 * Represents a complete function definition extracted from an Amplify Gen 1 project
 * during migration to Gen 2. This interface combines configuration data from multiple
 * sources including local metadata, AWS Lambda configurations, and CloudWatch schedules.
 */
export interface AuthAccess {
  manageUsers?: boolean;
  manageGroups?: boolean;
  manageGroupMembership?: boolean;
  manageUserDevices?: boolean;
  managePasswordRecovery?: boolean;
  addUserToGroup?: boolean;
  createUser?: boolean;
  deleteUser?: boolean;
  deleteUserAttributes?: boolean;
  disableUser?: boolean;
  enableUser?: boolean;
  forgetDevice?: boolean;
  getDevice?: boolean;
  getUser?: boolean;
  listUsers?: boolean;
  listDevices?: boolean;
  listGroupsForUser?: boolean;
  listUsersInGroup?: boolean;
  removeUserFromGroup?: boolean;
  resetUserPassword?: boolean;
  setUserMfaPreference?: boolean;
  setUserPassword?: boolean;
  setUserSettings?: boolean;
  updateDeviceStatus?: boolean;
  updateUserAttributes?: boolean;
}

export interface FunctionDefinition {
  /** The Amplify category this function belongs to (e.g., 'function', 'auth', 'storage') */
  category?: string;
  /** The entry point file path for the function (typically './handler.ts' in Gen 2) */
  entry?: string;
  /** The AWS Lambda function name (includes environment suffix in Gen 1) */
  name?: string;
  /** Maximum execution time in seconds before Lambda times out */
  timeoutSeconds?: number;
  /** Memory allocation in MB for the Lambda function */
  memoryMB?: number;
  /** Environment variables configuration from AWS Lambda */
  environment?: EnvironmentResponse;
  /** AWS Lambda runtime (e.g., 'nodejs18.x', 'python3.9') */
  runtime?: Runtime | string;
  /** The Amplify resource name used for identification and file generation */
  resourceName?: string;
  /** CloudWatch Events schedule expression (e.g., 'rate(5 minutes)', 'cron(0 12 * * ? *)') */
  schedule?: string;
  /** Auth access permissions for this function */
  authAccess?: AuthAccess;
  /** CloudFormation template content for parsing permissions */
  templateContent?: string;
}

/** TypeScript AST factory for creating code nodes */
const factory = ts.factory;

const gen2BranchNameVariableName = 'branchName';

/**
 * Creates a TypeScript property assignment for function configuration parameters.
 * Used to build the object literal passed to defineFunction().
 *
 * @param name - The property name (e.g., 'timeoutSeconds', 'memoryMB')
 * @param value - The TypeScript expression representing the property value
 * @returns TypeScript PropertyAssignment node
 */
const createParameter = (
  name: string,
  value: ts.LiteralExpression | ts.ObjectLiteralExpression | ts.TemplateExpression,
): ts.PropertyAssignment => factory.createPropertyAssignment(factory.createIdentifier(name), value);

/**
 * Creates a TypeScript const variable statement.
 * Used for declaring variables like AMPLIFY_GEN_1_ENV_NAME.
 *
 * @param variableDeclaration - The variable declaration to wrap in a statement
 * @returns TypeScript VariableStatement node
 */
const createVariableStatement = (variableDeclaration: VariableDeclaration): VariableStatement => {
  return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
};

/**
 * Creates a TypeScript template literal expression for dynamic string interpolation.
 * Used for creating function names and environment variable references.
 *
 * @param templateHead - The static string before the interpolated variable
 * @param templateSpan - The variable name to interpolate
 * @param templateTail - The static string after the interpolated variable
 * @returns TypeScript TemplateExpression node
 */
const createTemplateLiteral = (templateHead: string, templateSpan: string, templateTail: string) => {
  return factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
    factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
  ]);
};

/**
 * Generates a complete TypeScript file containing an Amplify Gen 2 function definition
 * based on a Gen 1 function configuration. This is the main entry point for function
 * code generation during migration.
 *
 * The generated file includes:
 * - Import statements for @aws-amplify/backend
 * - A placeholder error message directing users to their original source code
 * - Environment variable setup for maintaining Gen 1 naming conventions
 * - A complete defineFunction() call with all migrated configuration
 *
 * Example output:
 * ```typescript
 * import { defineFunction } from '@aws-amplify/backend';
 *
 * const AMPLIFY_GEN_1_ENV_NAME = process.env.AMPLIFY_GEN_1_ENV_NAME ?? "sandbox";
 *
 * export const myFunction = defineFunction({
 *   entry: './handler.ts',
 *   name: `myFunction-${AMPLIFY_GEN_1_ENV_NAME}`,
 *   timeoutSeconds: 30,
 *   memoryMB: 128,
 *   runtime: 18,
 *   schedule: 'every 5m'
 * });
 * ```
 *
 * @param definition - The function definition extracted from Gen 1 project
 * @param appId - The Amplify app ID for secret path resolution
 * @param backendEnvironmentName - The backend environment name for secret path resolution
 * @returns Complete TypeScript source code as a string
 */
export function renderFunctions(definition: FunctionDefinition, appId?: string, backendEnvironmentName?: string | undefined) {
  const postImportStatements = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineFunction');

  // Remove error message - handler file should be empty

  // Generate the defineFunction() configuration object
  const defineFunctionProperty = createFunctionDefinition(definition, postImportStatements, namedImports, appId, backendEnvironmentName);

  const amplifyGen1EnvStatement = createVariableStatement(
    factory.createVariableDeclaration(
      gen2BranchNameVariableName,
      undefined,
      undefined,
      factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
    ),
  );
  postImportStatements.push(amplifyGen1EnvStatement);

  // Render the complete TypeScript file using the resource template
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier(definition?.resourceName || 'sayHello'),
    functionCallParameter: factory.createObjectLiteralExpression(defineFunctionProperty, true),
    backendFunctionConstruct: 'defineFunction',
    additionalImportedBackendIdentifiers: namedImports,
    postImportStatements,
  });
}

/**
 * Creates the configuration object properties for a defineFunction() call in Gen 2.
 * This function handles the conversion of Gen 1 function configuration to Gen 2 format,
 * including format transformations and special handling for secrets and environment variables.
 *
 * Key transformations performed:
 * - Runtime conversion: 'nodejs18.x' → 18
 * - Schedule format: 'rate(5 minutes)' → 'every 5m'
 * - Function naming: Preserves environment-specific naming with template literals
 * - Environment variables: Handles secrets and ENV variable mapping
 * - Entry point: Standardizes to './handler.ts' for Gen 2
 *
 * @param definition - The function definition from Gen 1 project
 * @param postImportStatements - Array to collect additional statements (errors, imports)
 * @param namedImports - Map to track required imports from @aws-amplify/backend
 * @param appId - Amplify app ID for resolving secret paths
 * @param backendEnvironmentName - Backend environment name for resolving secret paths
 * @returns Array of TypeScript object literal properties for defineFunction()
 */
export function createFunctionDefinition(
  definition?: FunctionDefinition,
  postImportStatements?: (ts.CallExpression | ts.JSDoc | ts.ExpressionStatement)[],
  namedImports?: Record<string, Set<string>>,
  appId?: string,
  backendEnvironmentName?: string,
) {
  const defineFunctionProperties: ObjectLiteralElementLike[] = [];

  // Parse auth access from CloudFormation template if available
  if (definition?.templateContent && !definition.authAccess) {
    definition.authAccess = parseAuthAccessFromTemplate(definition.templateContent);
  }

  // Fallback to index.js if there is no entry
  const entryPoint = definition?.entry || './index.js';
  defineFunctionProperties.push(createParameter('entry', factory.createStringLiteral(entryPoint)));
  if (definition?.name) {
    const funcNameAssignment = createTemplateLiteral(`${definition.resourceName}-`, gen2BranchNameVariableName, '');
    defineFunctionProperties.push(createParameter('name', funcNameAssignment));
  }

  // Copy timeout configuration directly from Gen 1
  if (definition?.timeoutSeconds) {
    defineFunctionProperties.push(createParameter('timeoutSeconds', factory.createNumericLiteral(definition.timeoutSeconds)));
  }

  // Copy memory configuration directly from Gen 1
  if (definition?.memoryMB) {
    defineFunctionProperties.push(createParameter('memoryMB', factory.createNumericLiteral(definition.memoryMB)));
  }

  // Process environment variables with special handling for secrets and ENV variable
  if (definition?.environment?.Variables) {
    defineFunctionProperties.push(
      createParameter(
        'environment',
        factory.createObjectLiteralExpression(
          Object.entries(definition.environment.Variables).map(([key, value]) => {
            // Handle API_KEY secrets that were stored in AWS Systems Manager Parameter Store
            // Gen 1 stored secrets as SSM parameters, Gen 2 uses the secret() function
            if (key == 'API_KEY' && value.startsWith(`/amplify/${appId}/${backendEnvironmentName}`)) {
              // Remove secret error message

              // Add the 'secret' import to the namedImports
              if (namedImports && namedImports['@aws-amplify/backend']) {
                namedImports['@aws-amplify/backend'].add('secret');
              } else {
                const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
                namedImports['@aws-amplify/backend'].add('secret');
              }

              // Generate: API_KEY: secret('API_KEY')
              return factory.createPropertyAssignment(
                key,
                factory.createCallExpression(factory.createIdentifier('secret'), undefined, [factory.createStringLiteral('API_KEY')]),
              );
            } else if (key == 'ENV') {
              const envNameAssignment = createTemplateLiteral('', gen2BranchNameVariableName, '');
              return createParameter(key, envNameAssignment);
            }

            // For all other environment variables, copy them as string literals
            return createParameter(key, factory.createStringLiteral(value));
          }),
        ),
      ),
    );
  }

  // Convert AWS Lambda runtime strings to Gen 2 numeric format
  // Gen 1 uses strings like 'nodejs18.x', Gen 2 uses numbers like 18
  const runtime = definition?.runtime;
  if (runtime && runtime.includes('nodejs')) {
    let nodeRuntime: number | undefined;

    // Map AWS Lambda runtime strings to Node.js version numbers
    switch (runtime) {
      case Runtime.nodejs16x:
        nodeRuntime = 16;
        break;
      case Runtime.nodejs18x:
        nodeRuntime = 18;
        break;
      case Runtime.nodejs20x:
        nodeRuntime = 20;
        break;
      case 'nodejs22x':
      case Runtime.nodejs22x:
        nodeRuntime = 22;
        break;
      default:
        throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }
    assert(nodeRuntime, 'Expected nodejs version to be set');

    // Generate: runtime: 18
    defineFunctionProperties.push(createParameter('runtime', factory.createNumericLiteral(nodeRuntime)));
  }

  // Convert CloudWatch Events schedule expressions from Gen 1 to Gen 2 format
  // Gen 1 uses AWS CloudWatch syntax, Gen 2 uses a more human-readable format
  if (definition?.schedule) {
    const rawScheduleExpression = definition.schedule;
    let scheduleExpression: string | undefined;

    // Extract the content between parentheses from expressions like 'rate(5 minutes)' or 'cron(0 12 * * ? *)'
    const startIndex = rawScheduleExpression.indexOf('(') + 1;
    const endIndex = rawScheduleExpression.lastIndexOf(')');
    const scheduleValue = startIndex > 0 && endIndex > startIndex ? rawScheduleExpression.slice(startIndex, endIndex) : undefined;

    // Handle rate expressions: 'rate(5 minutes)' → 'every 5m'
    if (rawScheduleExpression?.startsWith('rate(')) {
      const rateValue = scheduleValue;
      if (rateValue) {
        const [value, unit] = rateValue.split(' ');

        // Map time units to Gen 2 abbreviations
        const unitMap: Record<string, string> = {
          minute: 'm',
          minutes: 'm',
          hour: 'h',
          hours: 'h',
          day: 'd',
          days: 'd',
        };

        // Generate: 'every 5m', 'every 1h', 'every 2d'
        scheduleExpression = `every ${value}${unitMap[unit]}`;
      }
    }
    // Handle cron expressions: 'cron(0 12 * * ? *)' → '0 12 * * ? *'
    else if (rawScheduleExpression?.startsWith('cron(')) {
      // Extract the cron expression as-is (Gen 2 supports standard cron syntax)
      scheduleExpression = scheduleValue;
    }

    // Add the schedule parameter if we successfully converted the expression
    if (scheduleExpression) {
      defineFunctionProperties.push(createParameter('schedule', factory.createStringLiteral(scheduleExpression)));
    }
  }

  // Return all the collected properties for the defineFunction() configuration object
  return defineFunctionProperties;
}
