import { defineAuth } from '@aws-amplify/backend';
import { fitnesstracker33f5545533f55455PreSignup } from '../function/fitnesstracker33f5545533f55455PreSignup/resource';
import { admin } from '../function/admin/resource';
import type { Backend } from '../backend';
import { Duration } from 'aws-cdk-lib';

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
  groups: ['Admin'],
  triggers: {
    preSignUp: fitnesstracker33f5545533f55455PreSignup,
  },
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow.resource(admin).to(['getDevice']),
    allow.resource(admin).to(['getUser']),
    allow.resource(admin).to(['listDevices']),
    allow.resource(admin).to(['listGroupsForUser']),
    allow.resource(admin).to(['listUsers']),
    allow.resource(admin).to(['listUsersInGroup']),
    allow.resource(admin).to(['listGroups']),
  ],
});

export function applyEscapeHatches(backend: Backend) {
  const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
  cfnUserPool.usernameAttributes = undefined;
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
  cfnIdentityPool.allowUnauthenticatedIdentities = false;
  const userPool = backend.auth.resources.userPool;
  userPool.addClient('NativeAppClient', {
    refreshTokenValidity: Duration.days(30),
    enableTokenRevocation: true,
    enablePropagateAdditionalUserContextData: false,
    authSessionValidity: Duration.minutes(3),
    disableOAuth: true,
    generateSecret: false,
  });
};
