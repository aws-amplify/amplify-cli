import {
  AuthTriggerConnection,
  AuthTriggerPermissions,
  TriggerType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
// eslint-disable-next-line spellcheck/spell-checker
import { createCustomResourceforAuthTrigger } from '../../../../provider-utils/awscloudformation/utils/generate-auth-trigger-template';

jest.mock('uuid');
describe('generate Auth Trigger Template', () => {
  it('successfully generate auth Trigger Template', async () => {
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
    // eslint-disable-next-line spellcheck/spell-checker
    const cfn = await createCustomResourceforAuthTrigger(mockAuthTriggerConnections, false, mockAuthTriggerPermissions);
    expect(cfn).toMatchSnapshot();
  });

  it('successfully generate auth Trigger Template without permissions', async () => {
    const mockAuthTriggerConnections: AuthTriggerConnection[] = [
      {
        lambdaFunctionName: 'randomFn',
        triggerType: TriggerType.PreAuthentication,
        lambdaFunctionArn: 'randomArn',
      },
    ];

    const mockAuthTriggerPermissions: AuthTriggerPermissions[] = [];
    // eslint-disable-next-line spellcheck/spell-checker
    const cfn = await createCustomResourceforAuthTrigger(mockAuthTriggerConnections, false, mockAuthTriggerPermissions);
    expect(cfn).toMatchSnapshot();
  });
});
