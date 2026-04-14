import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Verification',
      verificationEmailBody: () => 'Here is your verification code {####}',
    },
  },
  userAttributes: {
    phoneNumber: {
      required: true,
      mutable: true,
    },
    email: {
      required: true,
      mutable: true,
    },
  },
  multifactor: {
    mode: 'OFF',
  },
});
