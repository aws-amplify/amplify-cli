import { defineAuth, secret } from '@aws-amplify/backend';
import { addusertogroup } from '../function/addusertogroup/resource';
import { removeuserfromgroup } from '../function/removeuserfromgroup/resource';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: () => 'Your verification code is {####}',
    },
    phone: true,
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
  access: (allow: any) => [
    allow.resource(addusertogroup).to(['manageUsers']),
    allow.resource(addusertogroup).to(['manageGroupMembership']),
    allow.resource(addusertogroup).to(['manageUserDevices']),
    allow.resource(addusertogroup).to(['managePasswordRecovery']),
    allow.resource(addusertogroup).to(['setUserMfaPreference']),
    allow.resource(addusertogroup).to(['updateUserAttributes']),
    allow.resource(addusertogroup).to(['forgetDevice']),
    allow.resource(addusertogroup).to(['setUserSettings']),
    allow.resource(addusertogroup).to(['listUsers']),
    allow.resource(addusertogroup).to(['listUsersInGroup']),
    allow.resource(addusertogroup).to(['listGroups']),
    allow.resource(removeuserfromgroup).to(['manageUsers']),
    allow.resource(removeuserfromgroup).to(['manageGroupMembership']),
    allow.resource(removeuserfromgroup).to(['manageUserDevices']),
    allow.resource(removeuserfromgroup).to(['managePasswordRecovery']),
    allow.resource(removeuserfromgroup).to(['setUserMfaPreference']),
    allow.resource(removeuserfromgroup).to(['updateUserAttributes']),
    allow.resource(removeuserfromgroup).to(['forgetDevice']),
    allow.resource(removeuserfromgroup).to(['setUserSettings']),
    allow.resource(removeuserfromgroup).to(['listUsers']),
    allow.resource(removeuserfromgroup).to(['listUsersInGroup']),
    allow.resource(removeuserfromgroup).to(['listGroups']),
  ],
});
