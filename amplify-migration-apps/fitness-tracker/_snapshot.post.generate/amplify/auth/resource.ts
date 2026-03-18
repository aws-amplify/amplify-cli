import { defineAuth } from '@aws-amplify/backend';
import { fitnesstracker6b0fc1196b0fc119PreSignup } from './fitnesstracker6b0fc1196b0fc119PreSignup/resource';
import { admin } from '../function/admin/resource';

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
    preSignUp: fitnesstracker6b0fc1196b0fc119PreSignup,
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
