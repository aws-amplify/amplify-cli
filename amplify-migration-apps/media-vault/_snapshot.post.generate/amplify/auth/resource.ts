import { defineAuth, secret } from '@aws-amplify/backend';
import { CfnResource, Duration } from 'aws-cdk-lib';
import {
  OAuthScope,
  UserPoolClientIdentityProvider,
  CfnUserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';
import type { Backend } from '../backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: () => 'Your verification code is {####}',
    },
    phone: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['openid', 'email', 'profile'],
        attributeMapping: {
          email: 'email',
          custom: {
            username: 'sub',
          },
        },
      },
      facebook: {
        clientId: secret('FACEBOOK_CLIENT_ID'),
        clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
        scopes: ['email', 'public_profile'],
        attributeMapping: {
          email: 'email',
          custom: {
            username: 'id',
          },
        },
      },
      // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
      callbackUrls: ['https://main.mediavault.amplifyapp.com/'],
      // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
      logoutUrls: ['https://main.mediavault.amplifyapp.com/'],
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  groups: ['Admin', 'Basic'],
  multifactor: {
    mode: 'OFF',
  },
});

export function applyEscapeHatches(backend: Backend) {
  const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
  cfnUserPool.usernameAttributes = ['email', 'phone_number'];
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
  const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
  cfnIdentityPool.addPropertyDeletionOverride('SupportedLoginProviders');
  const cfnUserPoolClient =
    backend.auth.resources.cfnResources.cfnUserPoolClient;
  cfnUserPoolClient.allowedOAuthFlows = ['code'];
  const userPool = backend.auth.resources.userPool;
  const nativeUserPoolClient = userPool.addClient('NativeAppClient', {
    refreshTokenValidity: Duration.days(30),
    enableTokenRevocation: true,
    enablePropagateAdditionalUserContextData: false,
    authSessionValidity: Duration.minutes(3),
    supportedIdentityProviders: [
      UserPoolClientIdentityProvider.FACEBOOK,
      UserPoolClientIdentityProvider.GOOGLE,
      UserPoolClientIdentityProvider.COGNITO,
    ],
    oAuth: {
      // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
      callbackUrls: ['https://main.mediavault.amplifyapp.com/'],
      // Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.
      logoutUrls: ['https://main.mediavault.amplifyapp.com/'],
      flows: {
        authorizationCodeGrant: true,
        implicitCodeGrant: false,
        clientCredentials: false,
      },
      scopes: [
        OAuthScope.PHONE,
        OAuthScope.EMAIL,
        OAuthScope.OPENID,
        OAuthScope.PROFILE,
        OAuthScope.COGNITO_ADMIN,
      ],
    },
    disableOAuth: false,
    generateSecret: false,
  });
  const cognitoProviders =
    backend.auth.resources.cfnResources.cfnIdentityPool
      .cognitoIdentityProviders;
  if (cognitoProviders && Array.isArray(cognitoProviders)) {
    cognitoProviders.push({
      clientId: nativeUserPoolClient.userPoolClientId,
      providerName: `cognito-idp.${backend.auth.stack.region}.amazonaws.com/${userPool.userPoolId}`,
    });
  }
  const providerSetupResult = (
    backend.auth.stack.node.children.find(
      (child) => child.node.id === 'amplifyAuth'
    ) as any
  ).providerSetupResult;
  Object.keys(providerSetupResult).forEach((provider) => {
    const providerSetupPropertyValue = providerSetupResult[provider];
    if (
      providerSetupPropertyValue.node &&
      providerSetupPropertyValue.node.id.toLowerCase().endsWith('idp')
    ) {
      nativeUserPoolClient.node.addDependency(providerSetupPropertyValue);
    }
  });
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
          'AWS::Cognito::UserPoolDomain',
          'AWS::Cognito::UserPoolIdentityProvider',
        ].includes(c.cfnResourceType)
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
}

export function postRefactor(backend: Backend) {
  const cfnUserPoolDomain = backend.auth.resources.userPool.node.findChild(
    'UserPoolDomain'
  ).node.defaultChild as CfnUserPoolDomain;
  cfnUserPoolDomain.domain = 'mediavault1f08412d-1f08412d-x';
}
