import { getPermissionsBoundaryArn } from '@aws-amplify/amplify-cli-core';
import {
  AuthTriggerConnection,
  AuthTriggerPermissions,
  TriggerType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
import { createCustomResourceForAuthTrigger } from '../../../../provider-utils/awscloudformation/utils/generate-auth-trigger-template';
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('uuid');
describe('generate Auth Trigger Template', () => {
  it('successfully generate IAM policies when permissions are defined', async () => {
    const mockAuthTriggerConnections: AuthTriggerConnection[] = [
      {
        lambdaFunctionName: 'randomFn',
        triggerType: TriggerType.PostConfirmation,
        lambdaFunctionArn: 'randomArn',
      },
    ];

    const mockAuthTriggerPermissions: AuthTriggerPermissions[] = [
      {
        policyName: 'AddToGroupCognito',
        trigger: 'PostConfirmation',
        effect: 'Allow',
        actions: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:GetGroup', 'cognito-idp:CreateGroup'],
        resource: {
          paramType: '!GetAtt',
          keys: ['UserPool', 'Arn'],
        },
      },
    ];
    const cfn = await createCustomResourceForAuthTrigger(mockAuthTriggerConnections, false, mockAuthTriggerPermissions);
    expect(cfn.Resources.AmplifyfunctionrandomFnNamePostConfirmationAddToGroupCognito1120888F).toMatchInlineSnapshot(`
{
  "Properties": {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": [
            "cognito-idp:AdminAddUserToGroup",
            "cognito-idp:GetGroup",
            "cognito-idp:CreateGroup",
          ],
          "Effect": "Allow",
          "Resource": {
            "Ref": "userpoolArn",
          },
        },
      ],
      "Version": "2012-10-17",
    },
    "PolicyName": "AddToGroupCognito",
    "Roles": [
      {
        "Fn::Select": [
          1,
          {
            "Fn::Split": [
              "/",
              {
                "Fn::Select": [
                  5,
                  {
                    "Fn::Split": [
                      ":",
                      {
                        "Ref": "functionrandomFnLambdaExecutionRole",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  "Type": "AWS::IAM::Policy",
}
`);
    // No permissions boundary set if not available
    expect(cfn.Resources.authTriggerFnServiceRole08093B67.Properties.PermissionsBoundary).toBeUndefined();
  });

  it('adds permissions boundary to new role if available', async () => {
    // Setup for a successfully generating custom resource.
    const mockAuthTriggerConnections: AuthTriggerConnection[] = [
      {
        lambdaFunctionName: 'randomFn',
        triggerType: TriggerType.PostConfirmation,
        lambdaFunctionArn: 'randomArn',
      },
    ];
    const mockAuthTriggerPermissions: AuthTriggerPermissions[] = [
      {
        policyName: 'AddToGroupCognito',
        trigger: 'PostConfirmation',
        effect: 'Allow',
        actions: ['cognito-idp:AdminAddUserToGroup', 'cognito-idp:GetGroup', 'cognito-idp:CreateGroup'],
        resource: {
          paramType: '!GetAtt',
          keys: ['UserPool', 'Arn'],
        },
      },
    ];

    // ensure permissions boundary is set
    const getPermissionsBoundaryArn_mock = getPermissionsBoundaryArn as jest.MockedFunction<typeof getPermissionsBoundaryArn>;
    getPermissionsBoundaryArn_mock.mockReturnValue('testPermissionsBoundaryArn');

    // execute the test
    const cfn = await createCustomResourceForAuthTrigger(mockAuthTriggerConnections, false, mockAuthTriggerPermissions);

    //validate
    expect(cfn.Resources.authTriggerFnServiceRole08093B67.Properties.PermissionsBoundary).toStrictEqual('testPermissionsBoundaryArn');

    // Restore for other folks
    getPermissionsBoundaryArn_mock.mockRestore();
  });

  it('does not generate iam policies for Auth trigger when permissions are empty', async () => {
    const mockAuthTriggerConnections: AuthTriggerConnection[] = [
      {
        lambdaFunctionName: 'randomFn',
        triggerType: TriggerType.PreAuthentication,
        lambdaFunctionArn: 'randomArn',
      },
    ];

    const mockAuthTriggerPermissions: AuthTriggerPermissions[] = [];
    // eslint-disable-next-line spellcheck/spell-checker
    const cfn = await createCustomResourceForAuthTrigger(mockAuthTriggerConnections, false, mockAuthTriggerPermissions);
    expect(cfn.Resources.AmplifyfunctionrandomFnNamePostConfirmationAddToGroupCognito1120888F).not.toBeDefined();
  });
});

describe('generateNestedAuthTriggerTemplate', () => {
  it('adds "authTriggerFn" as a dependency on "CustomAuthTriggerResource"', async () => {
    const authTriggerConnections = [
      {
        triggerType: 'CustomMessage',
        lambdaFunctionName: 'authtestCustomMessage',
      },
      {
        triggerType: 'PostConfirmation',
        lambdaFunctionName: 'authtestostConfirmation',
      },
    ];

    const cfnTemplate = await createCustomResourceForAuthTrigger(authTriggerConnections, false);

    expect(cfnTemplate).toMatchSnapshot();
    expect(cfnTemplate.Resources.CustomAuthTriggerResource.DependsOn).toEqual(
      expect.arrayContaining([
        'authTriggerFn7FCFA449',
        'authTriggerFnServiceRoleDefaultPolicyEC9285A8',
        'authTriggerFnServiceRole08093B67',
      ]),
    );
  });
});
