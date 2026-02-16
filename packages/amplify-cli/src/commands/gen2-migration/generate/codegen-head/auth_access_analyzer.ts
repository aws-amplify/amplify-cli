import { BackendEnvironmentResolver } from './backend_environment_selector';
import { BackendDownloader } from './backend_downloader';
import { JSONUtilities, $TSMeta } from '@aws-amplify/amplify-cli-core';
import { fileOrDirectoryExists } from './directory_exists';
import { AuthAccess } from '../generators/functions/index';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert';

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

function extractCognitoActionsFromPolicy(amplifyResourcesPolicy: any): string[] {
  const actions: string[] = [];

  const policyDocument = amplifyResourcesPolicy.Properties?.PolicyDocument;
  const statements = Array.isArray(policyDocument?.Statement) ? policyDocument.Statement : [policyDocument?.Statement].filter(Boolean);

  for (const statement of statements) {
    const statementActions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];

    for (const action of statementActions) {
      if (typeof action === 'string' && action.startsWith('cognito-idp:')) {
        if (!actions.includes(action)) {
          actions.push(action);
        }
      }
    }
  }

  return actions;
}

export function parseAuthAccessFromTemplate(templateContent: string): AuthAccess {
  const authAccess: AuthAccess = {};

  const cfnTemplate = JSON.parse(templateContent);

  // Check only AmplifyResourcesPolicy for consistency with other parsers
  const amplifyResourcesPolicy = cfnTemplate.Resources?.AmplifyResourcesPolicy;

  if (!amplifyResourcesPolicy || amplifyResourcesPolicy.Type !== 'AWS::IAM::Policy') {
    return {};
  }

  const cognitoActions = extractCognitoActionsFromPolicy(amplifyResourcesPolicy);
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

/**
 * Combined auth access analyzer that handles both template fetching and parsing.
 * Provides centralized functionality for auth-related CloudFormation analysis.
 */
export class AuthAccessAnalyzer {
  constructor(private backendEnvironmentResolver: BackendEnvironmentResolver, private ccbFetcher: BackendDownloader) {}

  /**
   * Fetches CloudFormation templates for all functions in the project.
   * @returns Map of function names to their CloudFormation template content
   */
  async getFunctionTemplates(): Promise<Map<string, string>> {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.deploymentArtifacts);

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);
    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    const meta = JSONUtilities.readJson<$TSMeta>(amplifyMetaPath, { throwIfNotExist: true });
    const functions = meta?.function ?? {};

    const functionTemplates = new Map<string, string>();
    for (const functionName of Object.keys(functions)) {
      const templatePath = path.join(
        currentCloudBackendDirectory,
        'function',
        functionName,
        `${functionName}-cloudformation-template.json`,
      );
      if (await fileOrDirectoryExists(templatePath)) {
        const templateContent = await fs.readFile(templatePath, 'utf8');
        functionTemplates.set(functionName, templateContent);
      }
    }

    return functionTemplates;
  }

  /**
   * Analyzes auth access for all functions by fetching templates and parsing them.
   * @returns Map of function names to their auth access permissions
   */
  async getFunctionAuthAccess(): Promise<Map<string, AuthAccess>> {
    const templates = await this.getFunctionTemplates();
    const authAccessMap = new Map<string, AuthAccess>();

    for (const [functionName, templateContent] of templates) {
      const authAccess = parseAuthAccessFromTemplate(templateContent);
      if (Object.keys(authAccess).length > 0) {
        authAccessMap.set(functionName, authAccess);
      }
    }

    return authAccessMap;
  }
}
