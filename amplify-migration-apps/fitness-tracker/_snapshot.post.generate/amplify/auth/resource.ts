import { defineAuth } from '@aws-amplify/backend';
import { fitnesstracker33f5545533f55455PreSignup } from './fitnesstracker33f5545533f55455PreSignup/resource';
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
    preSignUp: fitnesstracker33f5545533f55455PreSignup,
  },
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow
      .resource(admin)
      .to([
        'getDevice',
        'getUser',
        'listDevices',
        'listGroupsForUser',
        'listUsers',
        'listUsersInGroup',
        'listGroups',
      ]),
  ],
});
