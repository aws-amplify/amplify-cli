import * as cdk from 'aws-cdk-lib';
import { AmplifyAuthCognitoStack } from '../../../../provider-utils/awscloudformation/auth-stack-builder/auth-cognito-stack-builder';
import { AuthStackSynthesizer } from '../../../../provider-utils/awscloudformation/auth-stack-builder/stack-synthesizer';
import {
  AttributeType,
  CognitoStackOptions,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';

describe('generateCognitoStackResources', () => {
  const props: CognitoStackOptions = {
    // eslint-disable-next-line spellcheck/spell-checker
    identityPoolName: 'issue96802f106de3_identitypool_2f106de3',
    allowUnauthenticatedIdentities: false,
    // eslint-disable-next-line spellcheck/spell-checker
    resourceNameTruncated: 'issue92f106de3',
    // eslint-disable-next-line spellcheck/spell-checker
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
    // eslint-disable-next-line spellcheck/spell-checker
    userpoolClientLambdaRole: 'issue92f106de3_userpoolclient_lambda_role',
    userpoolClientSetAttributes: false,
    sharedId: '2f106de3',
    // eslint-disable-next-line spellcheck/spell-checker
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
        // eslint-disable-next-line spellcheck/spell-checker
        resourceName: 'issue96802f106de32f106de3PreSignup',
        attributes: ['Arn', 'Name'],
      },
    ],
    permissions: [],
    // eslint-disable-next-line spellcheck/spell-checker
    authTriggerConnections: [{ triggerType: 'PreSignUp', lambdaFunctionName: 'issue96802f106de32f106de3PreSignup' }],
    authProviders: [],
  };

  it('adds correct preSignUp  lambda config and permissions', async () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoPreSignUpTriggerTest', { synthesizer: new AuthStackSynthesizer() });
    await cognitoStack.generateCognitoStackResources(props);
    expect(cognitoStack.userPool?.lambdaConfig).toHaveProperty('preSignUp');
    expect(cognitoStack.lambdaConfigPermissions).toHaveProperty('UserPoolPreSignupLambdaInvokePermission');
  });

  it('disables updateAttributeSetting when autoVerified attributes not present', async () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoPreSignUpTriggerTest', { synthesizer: new AuthStackSynthesizer() });
    const updatedProps = { ...props };
    delete updatedProps.autoVerifiedAttributes;
    await cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toBeUndefined();
  });

  it('correctly adds updateAttributeSetting when autoVerifiedAttributes attributes is TOTP', async () => {
    const testApp = new cdk.App();
    // eslint-disable-next-line spellcheck/spell-checker
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTest', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      userAutoVerifiedAttributeUpdateSettings: [AttributeType.PHONE_NUMBER],
    };
    await cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toMatchInlineSnapshot(`
{
  "attributesRequireVerificationBeforeUpdate": [
    "email",
  ],
}
`);
  });

  it('correctly adds updateAttributeSetting when autoVerifiedAttributes attributes is email', async () => {
    const testApp = new cdk.App();
    // eslint-disable-next-line spellcheck/spell-checker
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTesting1', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      userAutoVerifiedAttributeUpdateSettings: [AttributeType.EMAIL],
    };
    await cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toMatchInlineSnapshot(`
{
  "attributesRequireVerificationBeforeUpdate": [
    "email",
  ],
}
`);
    expect(cognitoStack.userPool!.lambdaConfig).toHaveProperty('preSignUp');
    expect(cognitoStack.userPoolClientWeb!.tokenValidityUnits).toHaveProperty('refreshToken');
    expect(cognitoStack.userPoolClient!.tokenValidityUnits).toHaveProperty('refreshToken');
    expect(cognitoStack.lambdaConfigPermissions).toHaveProperty('UserPoolPreSignupLambdaInvokePermission');
  });

  it('correctly adds oauth properties on userpool client when oauthMetaData is defined', async () => {
    const testApp = new cdk.App();
    // eslint-disable-next-line spellcheck/spell-checker
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTesting1', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      oAuthMetadata:
        '{"AllowedOAuthFlows":["code"],"AllowedOAuthScopes":["phone","email","openid","profile","aws.cognito.signin.user.admin"],"CallbackURLs":["https://localhost:3000/"]}',
    };
    await cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('allowedOAuthFlows');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('allowedOAuthScopes');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('callbackUrLs');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('logoutUrLs');

    expect(cognitoStack.userPoolClient).toHaveProperty('allowedOAuthFlows');
    expect(cognitoStack.userPoolClient).toHaveProperty('allowedOAuthScopes');
    expect(cognitoStack.userPoolClient).toHaveProperty('callbackUrLs');
    expect(cognitoStack.userPoolClient).toHaveProperty('logoutUrLs');
  });
});
