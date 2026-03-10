import { parseAuthAccessFromTemplate } from '../../../../commands/gen2-migration/generate-new/input/auth-access-analyzer';

function makeTemplate(actions: string | string[]): string {
  const actionValue = Array.isArray(actions) ? actions : [actions];
  return JSON.stringify({
    Resources: {
      AmplifyResourcesPolicy: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyDocument: {
            Statement: [{ Action: actionValue, Effect: 'Allow', Resource: '*' }],
          },
        },
      },
    },
  });
}

describe('parseAuthAccessFromTemplate', () => {
  it('returns empty object when no AmplifyResourcesPolicy exists', () => {
    const template = JSON.stringify({ Resources: {} });
    expect(parseAuthAccessFromTemplate(template)).toEqual({});
  });

  it('returns empty object when policy type is not IAM::Policy', () => {
    const template = JSON.stringify({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Role',
          Properties: {},
        },
      },
    });
    expect(parseAuthAccessFromTemplate(template)).toEqual({});
  });

  it('maps individual cognito actions to permission keys', () => {
    const result = parseAuthAccessFromTemplate(makeTemplate('cognito-idp:AdminCreateUser'));
    expect(result.createUser).toBe(true);
  });

  it('maps ListUsers action', () => {
    const result = parseAuthAccessFromTemplate(makeTemplate('cognito-idp:ListUsers'));
    expect(result.listUsers).toBe(true);
  });

  it('detects grouped manageUsers permission when all actions present', () => {
    const manageUsersActions = [
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
    ];
    const result = parseAuthAccessFromTemplate(makeTemplate(manageUsersActions));
    expect(result.manageUsers).toBe(true);
  });

  it('detects grouped manageGroupMembership permission', () => {
    const actions = ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRemoveUserFromGroup'];
    const result = parseAuthAccessFromTemplate(makeTemplate(actions));
    expect(result.manageGroupMembership).toBe(true);
  });

  it('expands AdminList* wildcard', () => {
    const result = parseAuthAccessFromTemplate(makeTemplate('cognito-idp:AdminList*'));
    expect(result.listDevices).toBe(true);
    expect(result.listGroupsForUser).toBe(true);
  });

  it('expands List* wildcard', () => {
    const result = parseAuthAccessFromTemplate(makeTemplate('cognito-idp:List*'));
    expect(result.listUsers).toBe(true);
    expect(result.listUsersInGroup).toBe(true);
    expect(result.listGroups).toBe(true);
  });

  it('ignores non-cognito actions', () => {
    const result = parseAuthAccessFromTemplate(makeTemplate('s3:GetObject'));
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('deduplicates actions from wildcards', () => {
    const actions = ['cognito-idp:AdminListDevices', 'cognito-idp:AdminList*'];
    const result = parseAuthAccessFromTemplate(makeTemplate(actions));
    expect(result.listDevices).toBe(true);
  });
});
