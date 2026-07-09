import { defineFunction } from '@aws-amplify/backend';
import { aws_iam } from 'aws-cdk-lib';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const removeuserfromgroup = defineFunction({
  entry: './index.js',
  name: `removeuserfromgroup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.removeuserfromgroup.resources.cfnResources.cfnFunction.functionName = `removeuserfromgroup-${branchName}`;
  backend.removeuserfromgroup.addEnvironment(
    'AUTH_MEDIAVAULT1F08412D_USERPOOLID',
    backend.auth.resources.userPool.userPoolId
  );
  new aws_iam.Policy(
    backend.removeuserfromgroup.resources.lambda,
    'UnmappedCognitoActionsPolicy',
    {
      statements: [
        new aws_iam.PolicyStatement({
          actions: [
            'cognito-idp:ConfirmSignUp',
            'cognito-idp:CreateUserImportJob',
            'cognito-idp:AdminLinkProviderForUser',
            'cognito-idp:CreateIdentityProvider',
            'cognito-idp:SetUICustomization',
            'cognito-idp:SignUp',
            'cognito-idp:SetRiskConfiguration',
            'cognito-idp:StartUserImportJob',
            'cognito-idp:AssociateSoftwareToken',
            'cognito-idp:CreateResourceServer',
            'cognito-idp:RespondToAuthChallenge',
            'cognito-idp:CreateUserPoolClient',
            'cognito-idp:GlobalSignOut',
            'cognito-idp:AddCustomAttributes',
            'cognito-idp:CreateUserPool',
            'cognito-idp:CreateUserPoolDomain',
            'cognito-idp:StopUserImportJob',
            'cognito-idp:InitiateAuth',
            'cognito-idp:ConfirmForgotPassword',
            'cognito-idp:VerifySoftwareToken',
            'cognito-idp:AdminDisableProviderForUser',
            'cognito-idp:SetUserPoolMfaConfig',
            'cognito-idp:ChangePassword',
            'cognito-idp:ConfirmDevice',
            'cognito-idp:ResendConfirmationCode',
            'cognito-idp:Describe*',
            'cognito-idp:ForgotPassword',
            'cognito-idp:UpdateAuthEventFeedback',
            'cognito-idp:UpdateResourceServer',
            'cognito-idp:UpdateUserPoolClient',
            'cognito-idp:UpdateUserPoolDomain',
            'cognito-idp:UpdateIdentityProvider',
            'cognito-idp:UpdateDeviceStatus',
            'cognito-idp:UpdateUserPool',
            'cognito-idp:DeleteUserPoolDomain',
            'cognito-idp:DeleteResourceServer',
            'cognito-idp:DeleteUserPoolClient',
            'cognito-idp:DeleteUserAttributes',
            'cognito-idp:DeleteUserPool',
            'cognito-idp:DeleteIdentityProvider',
            'cognito-idp:DeleteUser',
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
      roles: [backend.removeuserfromgroup.resources.lambda.role!],
    }
  );
}
