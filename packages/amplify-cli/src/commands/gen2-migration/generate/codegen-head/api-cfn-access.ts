import * as fs from 'node:fs';
import * as path from 'path';

/**
 * Analyzes CloudFormation templates to determine GraphQL API access permissions for Lambda functions
 */
export interface ApiPermissions {
  hasQuery: boolean;
  hasMutation: boolean;
  hasSubscription: boolean;
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
    let hasSubscription = false;

    // Check only AmplifyResourcesPolicy for consistency with other parsers
    const amplifyResourcesPolicy = cfnTemplate.Resources?.AmplifyResourcesPolicy;

    if (!amplifyResourcesPolicy || amplifyResourcesPolicy.Type !== 'AWS::IAM::Policy') {
      return { hasQuery: false, hasMutation: false, hasSubscription: false };
    }

    const policyDocument = amplifyResourcesPolicy.Properties?.PolicyDocument;
    const statements = Array.isArray(policyDocument?.Statement) ? policyDocument.Statement : [policyDocument?.Statement].filter(Boolean);

    for (const statement of statements) {
      const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
      const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];

      // Check if this statement has appsync:GraphQL action
      const hasAppSyncAction = actions.some((action) => action === 'appsync:GraphQL');

      if (hasAppSyncAction) {
        // Check resources to determine specific permissions
        for (const resourceArn of resources) {
          const resourceStr = typeof resourceArn === 'string' ? resourceArn : JSON.stringify(resourceArn);

          if (resourceStr.includes('/types/Query/')) {
            hasQuery = true;
          }
          if (resourceStr.includes('/types/Mutation/')) {
            hasMutation = true;
          }
          if (resourceStr.includes('/types/Subscription/')) {
            hasSubscription = true;
          }
        }
      }
    }
    return { hasQuery, hasMutation, hasSubscription };
  } catch {
    return { hasQuery: false, hasMutation: false, hasSubscription: false };
  }
};
