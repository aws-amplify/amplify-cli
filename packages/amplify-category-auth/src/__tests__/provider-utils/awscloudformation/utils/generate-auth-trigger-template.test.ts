import {
  AuthTriggerConnection,
  AuthTriggerPermissions,
  TriggerType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types';
import { createCustomResourceforAuthTrigger } from '../../../../provider-utils/awscloudformation/utils/generate-auth-trigger-template';

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
    const cfn = await createCustomResourceforAuthTrigger(mockAuthTriggerConnections, mockAuthTriggerPermissions);
    expect(cfn).toMatchSnapshot();
  });

  it('successfully generate auth Trigger Template', async () => {
    const mockAuthTriggerConnections: AuthTriggerConnection[] = [
      {
        lambdaFunctionName: 'randomFn',
        triggerType: TriggerType.PostConfirmation,
        lambdaFunctionArn: 'randomArn',
      },
    ];

    const mockAuthTriggerPermissions: AuthTriggerPermissions[] = [];
    const cfn = await createCustomResourceforAuthTrigger(mockAuthTriggerConnections, mockAuthTriggerPermissions);
    expect(cfn).toMatchSnapshot();
  });
});
