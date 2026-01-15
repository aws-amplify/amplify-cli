import ts from 'typescript';

const factory = ts.factory;

// Maps Gen1 environment variable patterns to Gen2 backend resource paths
// Handles both GraphQL data model tables (API_*TABLE_*) and standalone DynamoDB tables (STORAGE_*)
const ENV_VAR_PATTERNS = {
  'API_.*_GRAPHQLAPIENDPOINTOUTPUT': 'data.graphqlUrl',
  'API_.*_GRAPHQLAPIIDOUTPUT': 'data.apiId',
  'API_.*_GRAPHQLAPIKEYOUTPUT': 'data.apiKey!',
  'API_.*TABLE_ARN': 'data.resources.tables.{table}.tableArn',
  'API_.*TABLE_NAME': 'data.resources.tables.{table}.tableName',
  'AUTH_.*_USERPOOLID': 'auth.resources.userPool.userPoolId',
  'STORAGE_.*_ARN': '{table}.tableArn',
  'STORAGE_.*_NAME': '{table}.tableName',
  'STORAGE_.*_STREAMARN': '{table}.tableStreamArn!',
  'STORAGE_.*_BUCKETNAME': 'storage.resources.bucket.bucketName',
  'FUNCTION_.*_NAME': '{function}.resources.lambda.functionName',
};

/**
 * Generates escape hatch statements for Lambda function environment variables.
 * Creates backend.functionName.addEnvironment() calls for Gen1 env vars that reference other Amplify resources.
 *
 * @param functionName - The Gen2 function resource name
 * @param envVars - Environment variables from the Gen1 Lambda function
 * @returns Array of TypeScript statements for escape hatches
 */
export function generateLambdaEnvVars(functionName: string, envVars: Record<string, string>): ts.ExpressionStatement[] {
  const statements: ts.ExpressionStatement[] = [];

  for (const [envVar] of Object.entries(envVars)) {
    for (const [pattern, backendPath] of Object.entries(ENV_VAR_PATTERNS)) {
      if (new RegExp(`^${pattern}$`).test(envVar)) {
        let path = backendPath;
        let isDirect = false;
        // Extract table name from environment variable for DynamoDB resources
        if (path.includes('{table}')) {
          const tableMatch = envVar.match(/(?:API|STORAGE)_(.+?)(?:TABLE_|_)/);
          if (tableMatch) {
            let tableName = tableMatch[1];
            // Convert Gen1 table naming to Gen2 data model table keys:
            // API_TESTAPP_TODOTABLE_ARN -> 'TODOTABLE' -> 'TODO' (remove TABLE suffix)
            // STORAGE_MYTABLE_ARN -> 'MYTABLE' (keep as-is for standalone tables)
            if (envVar.startsWith('API_') && tableName.endsWith('TABLE')) {
              tableName = tableName.slice(0, -5); // Remove 'TABLE' suffix
            }
            path = path.replace('{table}', tableName);
            // API tables use backend references, STORAGE tables use direct CDK construct references
            isDirect = envVar.startsWith('STORAGE_');
          }
        }

        // Extract function name from environment variable for function references
        if (path.includes('{function}')) {
          const functionMatch = envVar.match(/FUNCTION_(.+?)_NAME/);
          if (functionMatch) {
            path = path.replace('{function}', functionMatch[1].toLowerCase());
            // Functions use backend reference, not direct reference
          }
        }

        let expression: ts.Expression;
        if (isDirect) {
          // Direct variable reference for standalone CDK constructs
          const pathParts = path.split('.');
          expression = factory.createIdentifier(pathParts[0]);
          for (let i = 1; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (part.endsWith('!')) {
              // Handle TypeScript non-null assertion operator
              expression = factory.createNonNullExpression(
                factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
              );
            } else {
              expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
            }
          }
        } else {
          // Backend reference for resources in defineBackend()
          // Example: backend.data.graphqlUrl (references resources through the backend object)
          const pathParts = ['backend', ...path.split('.')];
          expression = factory.createIdentifier(pathParts[0]);
          for (let i = 1; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (part.endsWith('!')) {
              // Handle TypeScript non-null assertion operator
              expression = factory.createNonNullExpression(
                factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
              );
            } else {
              expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
            }
          }
        }

        statements.push(
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
                factory.createIdentifier('addEnvironment'),
              ),
              undefined,
              [factory.createStringLiteral(envVar), expression],
            ),
          ),
        );
        break;
      }
    }
  }

  return statements;
}
