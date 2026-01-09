import { AuthAccess } from '../generators/functions/index';

const AUTH_ACTION_MAPPING: Record<string, keyof AuthAccess> = {
  // manageUsers actions
  'cognito-idp:AdminConfirmSignUp': 'manageUsers',
  'cognito-idp:AdminCreateUser': 'manageUsers',
  'cognito-idp:AdminDeleteUser': 'manageUsers',
  'cognito-idp:AdminDeleteUserAttributes': 'manageUsers',
  'cognito-idp:AdminDisableUser': 'manageUsers',
  'cognito-idp:AdminEnableUser': 'manageUsers',
  'cognito-idp:AdminGetUser': 'manageUsers',
  'cognito-idp:AdminListGroupsForUser': 'manageUsers',
  'cognito-idp:AdminRespondToAuthChallenge': 'manageUsers',
  'cognito-idp:AdminSetUserMFAPreference': 'manageUsers',
  'cognito-idp:AdminSetUserSettings': 'manageUsers',
  'cognito-idp:AdminUpdateUserAttributes': 'manageUsers',
  'cognito-idp:AdminUserGlobalSignOut': 'manageUsers',

  // manageGroupMembership actions
  'cognito-idp:AdminAddUserToGroup': 'manageGroupMembership',
  'cognito-idp:AdminRemoveUserFromGroup': 'manageGroupMembership',

  // manageGroups actions
  'cognito-idp:GetGroup': 'manageGroups',
  'cognito-idp:ListGroups': 'manageGroups',
  'cognito-idp:CreateGroup': 'manageGroups',
  'cognito-idp:DeleteGroup': 'manageGroups',
  'cognito-idp:UpdateGroup': 'manageGroups',

  // manageUserDevices actions
  'cognito-idp:AdminForgetDevice': 'manageUserDevices',
  'cognito-idp:AdminGetDevice': 'manageUserDevices',
  'cognito-idp:AdminListDevices': 'manageUserDevices',
  'cognito-idp:AdminUpdateDeviceStatus': 'manageUserDevices',

  // managePasswordRecovery actions
  'cognito-idp:AdminResetUserPassword': 'managePasswordRecovery',
  'cognito-idp:AdminSetUserPassword': 'managePasswordRecovery',

  // Individual actions
  'cognito-idp:ListUsers': 'listUsers',
  'cognito-idp:ListUsersInGroup': 'listUsersInGroup',
};

export function parseAuthAccessFromTemplate(templateContent: string): AuthAccess {
  const authAccess: AuthAccess = {};

  // Parse CloudFormation template for cognito-idp actions
  const cognitoActions = extractCognitoActions(templateContent);

  // Map individual actions to permissions
  cognitoActions.forEach((action) => {
    const permission = AUTH_ACTION_MAPPING[action];
    if (permission) {
      authAccess[permission] = true;
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
