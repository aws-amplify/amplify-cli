import { AmplifyAuthCognitoStack } from '../../../../provider-utils/awscloudformation/auth-stack-builder/auth-cognito-stack-builder';
import { AuthStackSynthesizer } from '../../../../provider-utils/awscloudformation/auth-stack-builder/stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';

describe('generateCognitoStackResources', () => {
  it('adds correct custom oauth lambda dependencies', () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });
    cognitoStack.userPoolClientRole = new iam.CfnRole(cognitoStack, 'testRole', {
      assumeRolePolicyDocument: 'test policy document',
    });
    cognitoStack.createHostedUICustomResource();
    cognitoStack.createHostedUIProviderCustomResource();
    cognitoStack.createOAuthCustomResource();
    expect(cognitoStack.oAuthCustomResource).toBeDefined();
    expect(
      cognitoStack
        .oAuthCustomResource!.node!.dependencies!.map((dep: any) => dep.target.logicalId)
        .map(logicalIdToken => /testCognitoStack\.([^\.]+)\.Default/.exec(logicalIdToken)![1]),
    ).toMatchInlineSnapshot(`
      Array [
        "HostedUICustomResourceInputs",
        "HostedUIProvidersCustomResourceInputs",
      ]
    `);
  });
});
