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
  // Individual permissions (most specific mapping)
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

  // Grouped permissions for actions not covered by individual permissions
  'cognito-idp:AdminConfirmSignUp': 'manageUsers',
  'cognito-idp:AdminRespondToAuthChallenge': 'manageUsers',
  'cognito-idp:AdminUserGlobalSignOut': 'manageUsers',
  'cognito-idp:AdminInitiateAuth': 'manageUsers',
  'cognito-idp:AdminUpdateAuthEventFeedback': 'manageUsers',
  'cognito-idp:CreateUserImportJob': 'manageUsers',
  'cognito-idp:StartUserImportJob': 'manageUsers',
  'cognito-idp:StopUserImportJob': 'manageUsers',
  'cognito-idp:AdminLinkProviderForUser': 'manageUsers',
  'cognito-idp:AdminDisableProviderForUser': 'manageUsers',
  'cognito-idp:AddCustomAttributes': 'manageUsers',
  'cognito-idp:ConfirmSignUp': 'manageUsers',
  'cognito-idp:SignUp': 'manageUsers',
  'cognito-idp:GlobalSignOut': 'manageUsers',
  'cognito-idp:ResendConfirmationCode': 'manageUsers',
  'cognito-idp:InitiateAuth': 'manageUsers',
  'cognito-idp:RespondToAuthChallenge': 'manageUsers',

  // Group management
  'cognito-idp:GetGroup': 'manageGroups',
  'cognito-idp:ListGroups': 'manageGroups',
  'cognito-idp:CreateGroup': 'manageGroups',
  'cognito-idp:DeleteGroup': 'manageGroups',
  'cognito-idp:UpdateGroup': 'manageGroups',

  // Device management
  'cognito-idp:ForgetDevice': 'forgetDevice',
  'cognito-idp:ConfirmDevice': 'manageUserDevices',

  // Password recovery
  'cognito-idp:ForgotPassword': 'managePasswordRecovery',
  'cognito-idp:ConfirmForgotPassword': 'managePasswordRecovery',
  'cognito-idp:ChangePassword': 'managePasswordRecovery',

  // User attributes
  'cognito-idp:VerifyUserAttribute': 'updateUserAttributes',
  'cognito-idp:UpdateUserAttributes': 'updateUserAttributes',
  'cognito-idp:UpdateAuthEventFeedback': 'updateUserAttributes',

  // MFA settings
  'cognito-idp:SetUserMFAPreference': 'setUserMfaPreference',
  'cognito-idp:AssociateSoftwareToken': 'setUserMfaPreference',
  'cognito-idp:VerifySoftwareToken': 'setUserMfaPreference',

  // User settings
  'cognito-idp:SetUserSettings': 'setUserSettings',

  // User Pool management (admin-level)
  'cognito-idp:CreateUserPool': 'manageUsers',
  'cognito-idp:UpdateUserPool': 'manageUsers',
  'cognito-idp:CreateUserPoolClient': 'manageUsers',
  'cognito-idp:UpdateUserPoolClient': 'manageUsers',
  'cognito-idp:CreateUserPoolDomain': 'manageUsers',
  'cognito-idp:UpdateUserPoolDomain': 'manageUsers',
  'cognito-idp:CreateIdentityProvider': 'manageUsers',
  'cognito-idp:UpdateIdentityProvider': 'manageUsers',
  'cognito-idp:CreateResourceServer': 'manageUsers',
  'cognito-idp:UpdateResourceServer': 'manageUsers',
  'cognito-idp:SetUICustomization': 'manageUsers',
  'cognito-idp:SetRiskConfiguration': 'manageUsers',
  'cognito-idp:SetUserPoolMfaConfig': 'manageUsers',
};

export function parseAuthAccessFromTemplate(templateContent: string): AuthAccess {
  const authAccess: AuthAccess = {};
  const cognitoActions = extractCognitoActions(templateContent);

  // First, map individual actions to individual permissions
  cognitoActions.forEach((action) => {
    const permission = AUTH_ACTION_MAPPING[action];
    if (permission) {
      authAccess[permission] = true;
    }
  });

  // Then, check for complete grouped permissions
  Object.entries(GROUPED_PERMISSIONS).forEach(([groupedPermission, requiredActions]) => {
    const hasAllActions = requiredActions.every((action) => cognitoActions.includes(action));
    if (hasAllActions) {
      authAccess[groupedPermission as keyof AuthAccess] = true;
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
