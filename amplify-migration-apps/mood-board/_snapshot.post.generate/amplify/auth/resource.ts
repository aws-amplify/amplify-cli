import { defineAuth } from '@aws-amplify/backend';
import { CfnResource, Duration } from 'aws-cdk-lib';
import type { Backend } from '../backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: () => 'Your verification code is {####}',
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  multifactor: {
    mode: 'OFF',
  },
});

export function applyEscapeHatches(backend: Backend) {
  const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
  cfnUserPool.usernameAttributes = ['email'];
  cfnUserPool.policies = {
    passwordPolicy: {
      minimumLength: 8,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSymbols: false,
      temporaryPasswordValidityDays: 7,
    },
  };
  const userPool = backend.auth.resources.userPool;
  const nativeClient = userPool.addClient('NativeAppClient', {
    refreshTokenValidity: Duration.days(30),
    enableTokenRevocation: true,
    enablePropagateAdditionalUserContextData: false,
    authSessionValidity: Duration.minutes(3),
    disableOAuth: true,
    generateSecret: false,
  });
  const cognitoProviders =
    backend.auth.resources.cfnResources.cfnIdentityPool
      .cognitoIdentityProviders;
  if (cognitoProviders && Array.isArray(cognitoProviders)) {
    cognitoProviders.push({
      clientId: nativeClient.userPoolClientId,
      providerName: `cognito-idp.${backend.auth.stack.region}.amazonaws.com/${userPool.userPoolId}`,
    });
  }
  for (const cfnResource of backend.auth.stack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        [
          'AWS::Cognito::UserPool',
          'AWS::Cognito::IdentityPool',
          'AWS::Cognito::UserPoolClient',
          'AWS::Cognito::IdentityPoolRoleAttachment',
          'AWS::Cognito::UserPoolGroup',
        ].includes(c.cfnResourceType)
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
}
