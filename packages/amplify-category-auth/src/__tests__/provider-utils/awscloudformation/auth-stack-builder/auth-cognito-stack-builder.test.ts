/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable max-lines-per-function */
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { FeatureFlags } from 'amplify-cli-core';
import { AmplifyAuthCognitoStack } from '../../../../provider-utils/awscloudformation/auth-stack-builder/auth-cognito-stack-builder';
import { AuthStackSynthesizer } from '../../../../provider-utils/awscloudformation/auth-stack-builder/stack-synthesizer';
import { CognitoStackOptions } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
import { AttributeType } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';

describe('generateCognitoStackResources', () => {
  const props: CognitoStackOptions = {
    identityPoolName: 'issue96802f106de3_identitypool_2f106de3',
    allowUnauthenticatedIdentities: false,
    resourceNameTruncated: 'issue92f106de3',
    userPoolName: 'issue96802f106de3_userpool_2f106de3',
    autoVerifiedAttributes: ['email'],
    mfaConfiguration: 'OFF',
    mfaTypes: ['SMS Text Message'],
    smsAuthenticationMessage: 'Your authentication code is {####}',
    smsVerificationMessage: 'Your verification code is {####}',
    emailVerificationSubject: 'Your verification code',
    emailVerificationMessage: 'Your verification code is {####}',
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
    requiredAttributes: ['email'],
    aliasAttributes: [],
    userpoolClientGenerateSecret: false,
    userpoolClientRefreshTokenValidity: 30,
    userpoolClientWriteAttributes: ['email'],
    userpoolClientReadAttributes: ['email'],
    userpoolClientLambdaRole: 'issue92f106de3_userpoolclient_lambda_role',
    userpoolClientSetAttributes: false,
    sharedId: '2f106de3',
    resourceName: 'issue96802f106de32f106de3',
    authSelections: 'identityPoolAndUserPool',
    useDefault: 'manual',
    thirdPartyAuth: false,
    userPoolGroups: false,
    adminQueries: false,
    triggers: {
      PreSignup: ['custom'],
    },
    hostedUI: false,
    userPoolGroupList: [],
    serviceName: 'Cognito',
    usernameCaseSensitive: false,
    useEnabledMfas: true,
    authRoleArn: {
      'Fn::GetAtt': ['AuthRole', 'Arn'],
    },
    unauthRoleArn: {
      'Fn::GetAtt': ['UnauthRole', 'Arn'],
    },
    breakCircularDependency: false,
    dependsOn: [
      {
        category: 'function',
        resourceName: 'issue96802f106de32f106de3PreSignup',
        attributes: ['Arn', 'Name'],
      },
    ],
    permissions: [],
    authTriggerConnections: [{ triggerType: 'PreSignUp', lambdaFunctionName: 'issue96802f106de32f106de3PreSignup' }],
    authProviders: [],
  };

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

  it('adds correct preSignUp  lambda config and permissions', () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoPreSignUpTriggerTest', { synthesizer: new AuthStackSynthesizer() });
    cognitoStack.generateCognitoStackResources(props);
    expect(cognitoStack.userPool?.lambdaConfig).toHaveProperty('preSignUp');
    expect(cognitoStack.lambdaConfigPermissions).toHaveProperty('UserPoolPreSignupLambdaInvokePermission');
  });

  it('disables updateAttributeSetting when autoVerified attributes not present', () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoPreSignUpTriggerTest', { synthesizer: new AuthStackSynthesizer() });
    const updatedProps = { ...props };
    delete updatedProps.autoVerifiedAttributes;
    cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toBeUndefined();
  });

  it('correctly adds updateAttributeSetting when autoVerifiedAttributes attributes is TOTP', () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTest', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      autoVerifiedAttributes: [AttributeType.PHONE_NUMBER],
    };
    cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toMatchInlineSnapshot(`
      Object {
        "attributesRequireVerificationBeforeUpdate": Array [
          "phone_number",
        ],
      }
    `);
  });

  it('correctly adds updateAttributeSetting when autoVerifiedAttributes attributes is email', () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTest1', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      autoVerifiedAttributes: [AttributeType.EMAIL],
    };
    cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toMatchInlineSnapshot(`
      Object {
        "attributesRequireVerificationBeforeUpdate": Array [
          "email",
        ],
      }
    `);
  });
});
