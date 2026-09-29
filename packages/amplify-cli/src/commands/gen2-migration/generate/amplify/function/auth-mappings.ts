import type { AuthPermissions, AuthTriggerEvent } from '../auth/auth.renderer';

/**
 * Maps Gen1 auth trigger function name suffixes to Gen2 trigger event names.
 *
 * Gen1 names auth trigger functions as `<authResourceName><TriggerSuffix>`.
 * This map converts the suffix to the corresponding Gen2 `defineAuth` trigger
 * event key. Source: `triggerEvents` in the Gen2 auth-construct package:
 * https://github.com/aws-amplify/amplify-backend/blob/%40aws-amplify/auth-construct%401.11.2/packages/auth-construct/src/trigger_events.ts#L5
 */
export const AUTH_TRIGGER_SUFFIX_TO_EVENT: Readonly<Record<string, AuthTriggerEvent>> = {
  PreSignup: 'preSignUp',
  CustomMessage: 'customMessage',
  UserMigration: 'userMigration',
  PostConfirmation: 'postConfirmation',
  PreAuthentication: 'preAuthentication',
  PostAuthentication: 'postAuthentication',
  PreTokenGeneration: 'preTokenGeneration',
  DefineAuthChallenge: 'defineAuthChallenge',
  CreateAuthChallenge: 'createAuthChallenge',
  VerifyAuthChallengeResponse: 'verifyAuthChallengeResponse',
};

/**
 * Maps Gen2 `AuthAction` group names to the IAM actions they expand to.
 *
 * When all actions in a group are present in a Gen1 function's IAM policy,
 * we emit the group name (e.g. `manageUsers`) in the generated `access` block
 * instead of listing individual permissions. This mirrors the `iamActionMap`
 * in the Gen2 backend-auth package:
 * https://github.com/aws-amplify/amplify-backend/blob/%40aws-amplify/backend-auth%401.9.3/packages/backend-auth/src/userpool_access_policy_factory.ts#L63
 */
export const GROUPED_AUTH_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  manageUsers: [
    'cognito-idp:AdminConfirmSignUp',
    'cognito-idp:AdminCreateUser',
    'cognito-idp:AdminDeleteUser',
    'cognito-idp:AdminDeleteUserAttributes',
    'cognito-idp:AdminDisableUser',
    'cognito-idp:AdminEnableUser',
    'cognito-idp:AdminGetUser',
    'cognito-idp:AdminListGroupsForUser',
    'cognito-idp:AdminRespondToAuthChallenge',
    'cognito-idp:AdminSetUserMFAPreference',
    'cognito-idp:AdminSetUserSettings',
    'cognito-idp:AdminUpdateUserAttributes',
    'cognito-idp:AdminUserGlobalSignOut',
  ],
  manageGroupMembership: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRemoveUserFromGroup'],
  manageGroups: [
    'cognito-idp:GetGroup',
    'cognito-idp:ListGroups',
    'cognito-idp:CreateGroup',
    'cognito-idp:DeleteGroup',
    'cognito-idp:UpdateGroup',
  ],
  manageUserDevices: [
    'cognito-idp:AdminForgetDevice',
    'cognito-idp:AdminGetDevice',
    'cognito-idp:AdminListDevices',
    'cognito-idp:AdminUpdateDeviceStatus',
  ],
  managePasswordRecovery: ['cognito-idp:AdminResetUserPassword', 'cognito-idp:AdminSetUserPassword'],
};

/**
 * Maps individual IAM actions to their Gen2 `AuthAction` name.
 *
 * Used as a fallback when a Gen1 function's IAM policy contains individual
 * cognito-idp actions that don't form a complete group (see
 * {@link GROUPED_AUTH_PERMISSIONS}). Each action maps to the singular
 * permission name used in the Gen2 `access` block.
 *
 * Source: `iamActionMap` in the Gen2 backend-auth package:
 * https://github.com/aws-amplify/amplify-backend/blob/%40aws-amplify/backend-auth%401.9.3/packages/backend-auth/src/userpool_access_policy_factory.ts#L63
 */
export const SINGULAR_AUTH_PERMISSIONS: Readonly<Record<string, keyof AuthPermissions>> = {
  'cognito-idp:AdminAddUserToGroup': 'addUserToGroup',
  'cognito-idp:AdminCreateUser': 'createUser',
  'cognito-idp:AdminDeleteUser': 'deleteUser',
  'cognito-idp:AdminDeleteUserAttributes': 'deleteUserAttributes',
  'cognito-idp:AdminDisableUser': 'disableUser',
  'cognito-idp:AdminEnableUser': 'enableUser',
  'cognito-idp:AdminForgetDevice': 'forgetDevice',
  'cognito-idp:AdminGetDevice': 'getDevice',
  'cognito-idp:AdminGetUser': 'getUser',
  'cognito-idp:AdminListDevices': 'listDevices',
  'cognito-idp:AdminListGroupsForUser': 'listGroupsForUser',
  'cognito-idp:AdminRemoveUserFromGroup': 'removeUserFromGroup',
  'cognito-idp:AdminResetUserPassword': 'resetUserPassword',
  'cognito-idp:AdminSetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:AdminSetUserPassword': 'setUserPassword',
  'cognito-idp:AdminSetUserSettings': 'setUserSettings',
  'cognito-idp:AdminUpdateDeviceStatus': 'updateDeviceStatus',
  'cognito-idp:AdminUpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:ListUsers': 'listUsers',
  'cognito-idp:ListUsersInGroup': 'listUsersInGroup',
  'cognito-idp:ListGroups': 'listGroups',
  'cognito-idp:CreateGroup': 'createGroup',
  'cognito-idp:DeleteGroup': 'deleteGroup',
  'cognito-idp:GetGroup': 'getGroup',
  'cognito-idp:UpdateGroup': 'updateGroup',
  'cognito-idp:AdminConfirmSignUp': 'manageUsers',
  'cognito-idp:AdminRespondToAuthChallenge': 'manageUsers',
  'cognito-idp:AdminUserGlobalSignOut': 'manageUsers',
  'cognito-idp:AdminInitiateAuth': 'manageUsers',
  'cognito-idp:AdminUpdateAuthEventFeedback': 'manageUsers',
  'cognito-idp:ForgetDevice': 'forgetDevice',
  'cognito-idp:VerifyUserAttribute': 'updateUserAttributes',
  'cognito-idp:UpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:SetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:SetUserSettings': 'setUserSettings',
};
