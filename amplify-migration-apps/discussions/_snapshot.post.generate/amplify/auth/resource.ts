import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Verification',
      verificationEmailBody: () => 'Here is your verification code {####}',
    },
    phone: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    phoneNumber: {
      required: true,
      mutable: true,
    },
  },
});
