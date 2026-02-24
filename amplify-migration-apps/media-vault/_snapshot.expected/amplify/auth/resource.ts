import { defineAuth } from '@aws-amplify/backend';
import { addusertogroup } from '../function/addusertogroup/resource';
import { removeuserfromgroup } from '../function/removeuserfromgroup/resource';

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
  groups: ['Admin', 'Basic'],
  multifactor: {
    mode: 'OFF',
  },
  access: (allow: any) => [
    allow.resource(addusertogroup).to(['manageGroupMembership']),
    allow.resource(addusertogroup).to(['managePasswordRecovery']),
    allow.resource(addusertogroup).to(['createUser']),
    allow.resource(addusertogroup).to(['setUserSettings']),
    allow.resource(addusertogroup).to(['manageUsers']),
    allow.resource(addusertogroup).to(['disableUser']),
    allow.resource(addusertogroup).to(['setUserMfaPreference']),
    allow.resource(addusertogroup).to(['updateUserAttributes']),
    allow.resource(addusertogroup).to(['forgetDevice']),
    allow.resource(addusertogroup).to(['enableUser']),
    allow.resource(addusertogroup).to(['updateDeviceStatus']),
    allow.resource(addusertogroup).to(['getDevice']),
    allow.resource(addusertogroup).to(['getUser']),
    allow.resource(addusertogroup).to(['deleteUserAttributes']),
    allow.resource(addusertogroup).to(['deleteUser']),
    allow.resource(removeuserfromgroup).to(['manageGroupMembership']),
    allow.resource(removeuserfromgroup).to(['managePasswordRecovery']),
    allow.resource(removeuserfromgroup).to(['createUser']),
    allow.resource(removeuserfromgroup).to(['setUserSettings']),
    allow.resource(removeuserfromgroup).to(['manageUsers']),
    allow.resource(removeuserfromgroup).to(['disableUser']),
    allow.resource(removeuserfromgroup).to(['setUserMfaPreference']),
    allow.resource(removeuserfromgroup).to(['updateUserAttributes']),
    allow.resource(removeuserfromgroup).to(['forgetDevice']),
    allow.resource(removeuserfromgroup).to(['enableUser']),
    allow.resource(removeuserfromgroup).to(['updateDeviceStatus']),
    allow.resource(removeuserfromgroup).to(['getDevice']),
    allow.resource(removeuserfromgroup).to(['getUser']),
    allow.resource(removeuserfromgroup).to(['deleteUserAttributes']),
    allow.resource(removeuserfromgroup).to(['deleteUser']),
  ],
});
