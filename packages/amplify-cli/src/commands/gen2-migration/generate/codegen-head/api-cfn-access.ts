import * as fs from 'node:fs';
import * as path from 'path';

/**
 * Analyzes CloudFormation templates to determine GraphQL API access permissions for Lambda functions
 */
export interface ApiPermissions {
  hasQuery: boolean;
  hasMutation: boolean;
}

/**
 * Analyzes a function's CloudFormation template to determine API permissions
 * @param functionResourceName - The Amplify function resource name
 * @returns Object indicating query and mutation permissions
 */
export const analyzeApiPermissionsFromCfn = (functionResourceName: string): ApiPermissions => {
  try {
    const cfnPath = path.join(
      'amplify',
      'backend',
      'function',
      functionResourceName,
      `${functionResourceName}-cloudformation-template.json`,
    );
    const cfnContent = fs.readFileSync(cfnPath, 'utf-8');
    const cfnTemplate = JSON.parse(cfnContent);

    let hasQuery = false;
    let hasMutation = false;

    // Check IAM policies in the template
    for (const resource of Object.values(cfnTemplate.Resources || {})) {
      if (resource && typeof resource === 'object' && 'Type' in resource && resource.Type === 'AWS::IAM::Policy') {
        const policyDocument = (resource as any).Properties?.PolicyDocument;
        const statements = policyDocument?.Statement || [];

        for (const statement of statements) {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];

          for (const action of actions) {
            if (action.includes('appsync:GraphQL')) {
              if (action.includes('Query') || action === 'appsync:GraphQL') {
                hasQuery = true;
              }
              if (action.includes('Mutation') || action === 'appsync:GraphQL') {
                hasMutation = true;
              }
            }
          }
        }
      }
    }

    return { hasQuery, hasMutation };
  } catch {
    return { hasQuery: false, hasMutation: false };
  }
};
