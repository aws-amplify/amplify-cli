import { Construct } from '@aws-cdk/core';
import { generateNestedAuthTriggerTemplate, createCustomResourceForAuthTrigger, CustomResourceAuthStack } from '../../../../provider-utils/awscloudformation/utils/generate-auth-trigger-template';

describe('generateNestedAuthTriggerTemplate', () => {
  it('adds "authTriggerFn" as a dependency on "CustomAuthTriggerResource"', () => {
    const authTriggerConnections = [
      {
        triggerType: 'CustomMessage',
        lambdaFunctionName: 'authtestCustomMessage'
      },
      {
        triggerType: 'PostConfirmation',
        lambdaFunctionName: 'authtestostConfirmation'
      }
    ];

    const cfnTemplate: any = createCustomResourceForAuthTrigger(authTriggerConnections);

    expect(cfnTemplate).toMatchSnapshot();
    expect(cfnTemplate["Resources"]["CustomAuthTriggerResource"]["DependsOn"]).toEqual(expect.arrayContaining([
      "authTriggerFn7FCFA449",
      "authTriggerFnServiceRoleDefaultPolicyEC9285A8",
      "authTriggerFnServiceRole08093B67",
    ]));
  });
});
