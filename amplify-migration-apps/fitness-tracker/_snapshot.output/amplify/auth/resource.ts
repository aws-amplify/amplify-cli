import { defineAuth } from '@aws-amplify/backend';
import { fitnesstracker969d5a9e969d5a9ePreSignup } from './fitnesstracker969d5a9e969d5a9ePreSignup/resource';
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
    preSignUp: fitnesstracker969d5a9e969d5a9ePreSignup,
  },
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow.resource(admin).to(['getDevice']),
    allow.resource(admin).to(['getUser']),
  ],
});
