import { defineAuth } from '@aws-amplify/backend';
import { projectboards54040eccPreTokenGeneration } from './projectboards54040eccPreTokenGeneration/resource';

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
  triggers: {
    preTokenGeneration: projectboards54040eccPreTokenGeneration,
  },
  multifactor: {
    mode: 'OFF',
  },
});
