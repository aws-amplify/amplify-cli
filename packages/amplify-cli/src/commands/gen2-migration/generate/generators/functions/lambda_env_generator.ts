import ts from 'typescript';

const factory = ts.factory;

const ENV_VAR_PATTERNS = {
  'API_.*_GRAPHQLAPIENDPOINTOUTPUT': 'data.graphqlUrl',
  'API_.*_GRAPHQLAPIIDOUTPUT': 'data.apiId',
  'API_.*_GRAPHQLAPIKEYOUTPUT': 'data.apiKey!',
  'API_.*_.*TABLE_ARN': 'data.resources.tables.{table}.tableArn',
  'API_.*_.*TABLE_NAME': 'data.resources.tables.{table}.tableName',
  'AUTH_.*_USERPOOLID': 'auth.resources.userPool.userPoolId',
  'STORAGE_.*_ARN': 'data.resources.tables.{table}.tableArn',
  'STORAGE_.*_NAME': 'data.resources.tables.{table}.tableName',
  'STORAGE_.*_STREAMARN': 'data.resources.tables.{table}.tableStreamArn',
  'STORAGE_.*_BUCKETNAME': 'storage.resources.bucket.bucketName',
};

export function generateEnvEscapeHatches(functionName: string, envVars: Record<string, string>): ts.ExpressionStatement[] {
  const statements: ts.ExpressionStatement[] = [];

  for (const [envVar, value] of Object.entries(envVars)) {
    for (const [pattern, backendPath] of Object.entries(ENV_VAR_PATTERNS)) {
      if (new RegExp(`^${pattern}$`).test(envVar)) {
        let path = backendPath;
        if (path.includes('{table}')) {
          const tableMatch = envVar.match(/(?:API|STORAGE)_.*?_(.+?)(?:TABLE_|_)/);
          if (tableMatch) path = path.replace('{table}', tableMatch[1].toLowerCase());
        }

        // Create property access expression: backend.data.graphqlUrl
        const pathParts = ['backend', ...path.split('.')];
        let expression: ts.Expression = factory.createIdentifier(pathParts[0]);
        for (let i = 1; i < pathParts.length; i++) {
          const part = pathParts[i];
          if (part.endsWith('!')) {
            // Handle non-null assertion: backend.data.apiKey!
            expression = factory.createNonNullExpression(
              factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
            );
          } else {
            expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
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
