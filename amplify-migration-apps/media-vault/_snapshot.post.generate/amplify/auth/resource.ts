import { defineAuth, secret } from '@aws-amplify/backend';
import { addusertogroup } from '../function/addusertogroup/resource';
import { removeuserfromgroup } from '../function/removeuserfromgroup/resource';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: () => 'Your verification code is {####}',
    },
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
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow
      .resource(addusertogroup)
      .to([
        'manageUsers',
        'manageGroupMembership',
        'manageUserDevices',
        'managePasswordRecovery',
        'setUserMfaPreference',
        'updateUserAttributes',
        'createGroup',
        'forgetDevice',
        'setUserSettings',
        'listUsers',
        'listUsersInGroup',
        'listGroups',
        'updateGroup',
        'deleteGroup',
      ]),
    allow
      .resource(removeuserfromgroup)
      .to([
        'manageUsers',
        'manageGroupMembership',
        'manageUserDevices',
        'managePasswordRecovery',
        'setUserMfaPreference',
        'updateUserAttributes',
        'createGroup',
        'forgetDevice',
        'setUserSettings',
        'listUsers',
        'listUsersInGroup',
        'listGroups',
        'updateGroup',
        'deleteGroup',
      ]),
  ],
});
