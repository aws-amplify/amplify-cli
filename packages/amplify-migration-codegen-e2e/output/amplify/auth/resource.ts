import { defineAuth } from '@aws-amplify/backend';
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
