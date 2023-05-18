import * as cdk from 'aws-cdk-lib';
import { AmplifyAuthCognitoStack } from '../../../../provider-utils/awscloudformation/auth-stack-builder/auth-cognito-stack-builder';
import { AuthStackSynthesizer } from '../../../../provider-utils/awscloudformation/auth-stack-builder/stack-synthesizer';
import {
  AttributeType,
  CognitoStackOptions,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  JSONUtilities: {
    parse: jest.fn().mockImplementation(JSON.parse),
    readJson: jest.fn().mockReturnValue({
      Resources: {},
    }),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
    getResourceCfnTemplatePath: jest.fn().mockReturnValue('cfn-template-path.json'),
  },
}));

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
    hostedUI: true,
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
    audiences: ['xxxgoogleClientIdxxx'],
    hostedUIProviderMeta:
      '[{"ProviderName":"Facebook","authorize_scopes":"email,public_profile","AttributeMapping":{"email":"email","username":"id"}},{"ProviderName":"Google","authorize_scopes":"openid email profile","AttributeMapping":{"email":"email","username":"sub"}},{"ProviderName":"LoginWithAmazon","authorize_scopes":"profile profile:user_id","AttributeMapping":{"email":"email","username":"user_id"}},{"ProviderName":"SignInWithApple","authorize_scopes":"email","AttributeMapping":{"email":"email"}}]',
    hostedUIProviderCreds:
      '[{"ProviderName":"Facebook","client_id":"sdcsdc","client_secret":"bfdsvsr"},{"ProviderName":"Google","client_id":"avearver","client_secret":"vcvereger"},{"ProviderName":"LoginWithAmazon","client_id":"vercvdsavcer","client_secret":"revfdsavrtv"},{"ProviderName":"SignInWithApple","client_id":"vfdvergver","team_id":"ervervre","key_id":"vfdavervfer","private_key":"vaveb"}]',
    authProviders: [],
  };

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
    // eslint-disable-next-line spellcheck/spell-checker
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTest', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      userAutoVerifiedAttributeUpdateSettings: [AttributeType.PHONE_NUMBER],
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

  it('correctly adds updateAttributeSetting when autoVerifiedAttributes attributes is email', () => {
    const testApp = new cdk.App();
    // eslint-disable-next-line spellcheck/spell-checker
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'CognitoUpdateAttributesettingTesting1', {
      synthesizer: new AuthStackSynthesizer(),
    });
    const updatedProps: CognitoStackOptions = {
      ...props,
      userAutoVerifiedAttributeUpdateSettings: [AttributeType.EMAIL],
    };
    cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPool?.userAttributeUpdateSettings).toMatchInlineSnapshot(`
      Object {
        "attributesRequireVerificationBeforeUpdate": Array [
          "email",
        ],
      }
    `);
    expect(cognitoStack.userPool!.lambdaConfig).toHaveProperty('preSignUp');
    expect(cognitoStack.userPoolClientWeb!.tokenValidityUnits).toHaveProperty('refreshToken');
    expect(cognitoStack.userPoolClient!.tokenValidityUnits).toHaveProperty('refreshToken');
    expect(cognitoStack.lambdaConfigPermissions).toHaveProperty('UserPoolPreSignupLambdaInvokePermission');
  });

  it('correctly adds oauth properties on userpool client when oauthMetaData is defined', () => {
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
    cognitoStack.generateCognitoStackResources(updatedProps);
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('allowedOAuthFlows');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('allowedOAuthScopes');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('callbackUrLs');
    expect(cognitoStack.userPoolClientWeb).toHaveProperty('logoutUrLs');

    expect(cognitoStack.userPoolClient).toHaveProperty('allowedOAuthFlows');
    expect(cognitoStack.userPoolClient).toHaveProperty('allowedOAuthScopes');
    expect(cognitoStack.userPoolClient).toHaveProperty('callbackUrLs');
    expect(cognitoStack.userPoolClient).toHaveProperty('logoutUrLs');
  });

  it('adds correct identity provider dependencies', async () => {
    const testApp = new cdk.App();
    const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

    await cognitoStack.generateCognitoStackResources(props);

    expect(cognitoStack.hostedUIProviderResources.length).toEqual(4);

    expect(
      cognitoStack
        .hostedUIProviderResources!.map((r) => r.cfnResourceType)
        .reduce((p, r) => {
          if (p === r) return p;
          else return 'null';
        }),
    ).toEqual('AWS::Cognito::UserPoolIdentityProvider');

    const providerNames = cognitoStack.hostedUIProviderResources!.map((r) => r.providerName);

    expect(providerNames).toContain('Facebook');
    expect(providerNames).toContain('Google');
    expect(providerNames).toContain('LoginWithAmazon');
    expect(providerNames).toContain('SignInWithApple');
  });
});
