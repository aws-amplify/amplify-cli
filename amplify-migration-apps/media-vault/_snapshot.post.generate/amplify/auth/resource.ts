import { defineAuth, secret } from '@aws-amplify/backend';
import { addusertogroup } from '../function/addusertogroup/resource';
import { removeuserfromgroup } from '../function/removeuserfromgroup/resource';
import { CfnResource, Duration } from 'aws-cdk-lib';
import {
  OAuthScope,
  UserPoolClientIdentityProvider,
} from 'aws-cdk-lib/aws-cognito';
import type { Backend } from '../backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: () => 'Your verification code is {####}',
    },
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        attributeMapping: {
          email: 'email',
        },
      },
      facebook: {
        clientId: secret('FACEBOOK_CLIENT_ID'),
        clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
        attributeMapping: {
          email: 'email',
        },
      },
      callbackUrls: ['https://main.mediavault.amplifyapp.com/'],
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
  access: (allow: any) => [
    allow.resource(addusertogroup).to(['manageUsers']),
    allow.resource(addusertogroup).to(['manageGroupMembership']),
    allow.resource(addusertogroup).to(['manageUserDevices']),
    allow.resource(addusertogroup).to(['managePasswordRecovery']),
    allow.resource(addusertogroup).to(['setUserMfaPreference']),
    allow.resource(addusertogroup).to(['updateUserAttributes']),
    allow.resource(addusertogroup).to(['createGroup']),
    allow.resource(addusertogroup).to(['forgetDevice']),
    allow.resource(addusertogroup).to(['setUserSettings']),
    allow.resource(addusertogroup).to(['listUsers']),
    allow.resource(addusertogroup).to(['listUsersInGroup']),
    allow.resource(addusertogroup).to(['listGroups']),
    allow.resource(addusertogroup).to(['updateGroup']),
    allow.resource(addusertogroup).to(['deleteGroup']),
    allow.resource(removeuserfromgroup).to(['manageUsers']),
    allow.resource(removeuserfromgroup).to(['manageGroupMembership']),
    allow.resource(removeuserfromgroup).to(['manageUserDevices']),
    allow.resource(removeuserfromgroup).to(['managePasswordRecovery']),
    allow.resource(removeuserfromgroup).to(['setUserMfaPreference']),
    allow.resource(removeuserfromgroup).to(['updateUserAttributes']),
    allow.resource(removeuserfromgroup).to(['createGroup']),
    allow.resource(removeuserfromgroup).to(['forgetDevice']),
    allow.resource(removeuserfromgroup).to(['setUserSettings']),
    allow.resource(removeuserfromgroup).to(['listUsers']),
    allow.resource(removeuserfromgroup).to(['listUsersInGroup']),
    allow.resource(removeuserfromgroup).to(['listGroups']),
    allow.resource(removeuserfromgroup).to(['updateGroup']),
    allow.resource(removeuserfromgroup).to(['deleteGroup']),
  ],
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
  const cfnUserPoolClient =
    backend.auth.resources.cfnResources.cfnUserPoolClient;
  cfnUserPoolClient.allowedOAuthFlows = ['code'];
  const userPool = backend.auth.resources.userPool;
  const userPoolClient = userPool.addClient('NativeAppClient', {
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
      callbackUrls: ['https://main.mediavault.amplifyapp.com/'],
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
    // flows: ['code'],
    disableOAuth: false,
    generateSecret: false,
  });
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
      userPoolClient.node.addDependency(providerSetupPropertyValue);
    }
  });
  // backend.auth.resources.userPool.node.tryRemoveChild("UserPoolDomain");
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
