import { AuthAccess } from '../output/auth/auth.renderer';

/**
 * Grouped Cognito permissions — when all actions in a group are present,
 * the group permission is set instead of individual ones.
 */
const GROUPED_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
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

const AUTH_ACTION_MAPPING: Readonly<Record<string, keyof AuthAccess>> = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCognitoActionsFromPolicy(amplifyResourcesPolicy: any): string[] {
  const actions: string[] = [];

  const policyDocument = amplifyResourcesPolicy.Properties?.PolicyDocument;
  const statements = Array.isArray(policyDocument?.Statement) ? policyDocument.Statement : [policyDocument?.Statement].filter(Boolean);

  for (const statement of statements) {
    const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];

    for (const action of statementActions) {
      if (typeof action === 'string' && action.startsWith('cognito-idp:')) {
        if (action === 'cognito-idp:AdminList*') {
          for (const a of ['cognito-idp:AdminListDevices', 'cognito-idp:AdminListGroupsForUser']) {
            if (!actions.includes(a)) actions.push(a);
          }
        } else if (action === 'cognito-idp:List*') {
          for (const a of ['cognito-idp:ListUsers', 'cognito-idp:ListUsersInGroup', 'cognito-idp:ListGroups']) {
            if (!actions.includes(a)) actions.push(a);
          }
        } else if (!actions.includes(action)) {
          actions.push(action);
        }
      }
    }
  }

  return actions;
}

/**
 * Parses a CloudFormation template and extracts Cognito auth access
 * permissions from the AmplifyResourcesPolicy resource.
 *
 * First checks for complete grouped permissions (e.g., manageUsers),
 * then maps remaining individual actions to individual permission keys.
 */
export function parseAuthAccessFromTemplate(templateContent: string): AuthAccess {
  const authAccess: Record<string, boolean> = {};
  const cfnTemplate = JSON.parse(templateContent);
  const amplifyResourcesPolicy = cfnTemplate.Resources?.AmplifyResourcesPolicy;

  if (!amplifyResourcesPolicy || amplifyResourcesPolicy.Type !== 'AWS::IAM::Policy') {
    return {};
  }

  const cognitoActions = extractCognitoActionsFromPolicy(amplifyResourcesPolicy);
  const coveredActions = new Set<string>();

  for (const [groupedPermission, requiredActions] of Object.entries(GROUPED_PERMISSIONS)) {
    const hasAllActions = requiredActions.every((action) => cognitoActions.includes(action));
    if (hasAllActions) {
      authAccess[groupedPermission] = true;
      for (const action of requiredActions) {
        coveredActions.add(action);
      }
    }
  }

  for (const action of cognitoActions) {
    if (!coveredActions.has(action)) {
      const permission = AUTH_ACTION_MAPPING[action];
      if (permission) {
        authAccess[permission] = true;
      }
    }
  }

  return authAccess as AuthAccess;
}
