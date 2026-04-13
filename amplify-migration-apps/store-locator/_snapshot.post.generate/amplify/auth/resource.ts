import { defineAuth } from '@aws-amplify/backend';
import { storelocator41a9495f41a9495fPostConfirmation } from './storelocator41a9495f41a9495fPostConfirmation/resource';

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
  groups: ['storeLocatorAdmin'],
  triggers: {
    postConfirmation: storelocator41a9495f41a9495fPostConfirmation,
  },
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow
      .resource(storelocator41a9495f41a9495fPostConfirmation)
      .to(['addUserToGroup']),
    allow
      .resource(storelocator41a9495f41a9495fPostConfirmation)
      .to(['manageGroups']),
  ],
});
