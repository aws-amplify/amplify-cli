import { AuthAccess } from '../generators/functions/index';

// Define grouped permissions and their required actions
const GROUPED_PERMISSIONS = {
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

const AUTH_ACTION_MAPPING: Record<string, keyof AuthAccess> = {
  // Individual permissions only - no conflicts with grouped permissions
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

  // Actions that don't have individual permissions - map to grouped
  'cognito-idp:AdminConfirmSignUp': 'manageUsers',
  'cognito-idp:AdminRespondToAuthChallenge': 'manageUsers',
  'cognito-idp:AdminUserGlobalSignOut': 'manageUsers',
  'cognito-idp:AdminInitiateAuth': 'manageUsers',
  'cognito-idp:AdminUpdateAuthEventFeedback': 'manageUsers',

  // Other actions without individual permissions
  'cognito-idp:ForgetDevice': 'forgetDevice',
  'cognito-idp:VerifyUserAttribute': 'updateUserAttributes',
  'cognito-idp:UpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:SetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:SetUserSettings': 'setUserSettings',
};

export function parseAuthAccessFromTemplate(templateContent: string): AuthAccess {
  const authAccess: AuthAccess = {};
  const cognitoActions = extractCognitoActions(templateContent);
  const coveredActions = new Set<string>();

  // First, check for complete grouped permissions
  Object.entries(GROUPED_PERMISSIONS).forEach(([groupedPermission, requiredActions]) => {
    const hasAllActions = requiredActions.every((action) => cognitoActions.includes(action));
    if (hasAllActions) {
      authAccess[groupedPermission as keyof AuthAccess] = true;
      // Mark these actions as covered by the group permission
      requiredActions.forEach((action) => coveredActions.add(action));
    }
  });

  // Then, map remaining individual actions to individual permissions
  cognitoActions.forEach((action) => {
    if (!coveredActions.has(action)) {
      const permission = AUTH_ACTION_MAPPING[action];
      if (permission) {
        authAccess[permission] = true;
      }
    }
  });

  return authAccess;
}

function extractCognitoActions(templateContent: string): string[] {
  const actions: string[] = [];
  const actionRegex = /"cognito-idp:[A-Za-z]+"/g;
  let match;

  while ((match = actionRegex.exec(templateContent)) !== null) {
    const action = match[0].replace(/"/g, '');
    if (!actions.includes(action)) {
      actions.push(action);
    }
  }

  return actions;
}
