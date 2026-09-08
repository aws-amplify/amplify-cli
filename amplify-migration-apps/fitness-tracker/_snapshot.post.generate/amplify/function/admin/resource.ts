import { defineFunction } from '@aws-amplify/backend';
import { aws_iam } from 'aws-cdk-lib';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const admin = defineFunction({
  entry: './index.js',
  name: `admin-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}` },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.admin.resources.cfnResources.cfnFunction.functionName = `admin-${branchName}`;
  backend.admin.addEnvironment(
    'AUTH_FITNESSTRACKER33F5545533F55455_USERPOOLID',
    backend.auth.resources.userPool.userPoolId
  );
  backend.admin.addEnvironment('REGION', backend.admin.stack.region);
  new aws_iam.Policy(
    backend.admin.resources.lambda,
    'UnmappedCognitoActionsPolicy',
    {
      statements: [
        new aws_iam.PolicyStatement({
          actions: [
            'cognito-idp:Describe*',
            'cognito-identity:Describe*',
            'cognito-identity:Get*',
            'cognito-identity:List*',
            'cognito-sync:Describe*',
            'cognito-sync:Get*',
            'cognito-sync:List*',
            'iam:ListOpenIdConnectProviders',
            'iam:ListRoles',
            'sns:ListPlatformApplications',
          ],
          resources: [backend.auth.resources.userPool.userPoolArn],
        }),
      ],
      roles: [backend.admin.resources.lambda.role!],
    }
  );
}
