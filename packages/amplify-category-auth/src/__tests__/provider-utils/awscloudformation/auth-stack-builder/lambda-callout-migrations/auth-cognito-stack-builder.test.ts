import * as cdk from 'aws-cdk-lib';
import { AmplifyAuthCognitoStack } from '../../../../../provider-utils/awscloudformation/auth-stack-builder/auth-cognito-stack-builder';
import { AuthStackSynthesizer } from '../../../../../provider-utils/awscloudformation/auth-stack-builder/stack-synthesizer';
import { CognitoStackOptions } from '../../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  JSONUtilities: {
    parse: jest.fn().mockImplementation(JSON.parse),
    readJson: jest.fn().mockReturnValue({
      Resources: {
        HostedUICustomResource: {
          Type: 'AWS::Lambda::Function',
        },
        HostedUIProvidersCustomResource: {
          Type: 'AWS::Lambda::Function',
        },
        OpenIdLambda: {
          Type: 'AWS::Lambda::Function',
        },
      },
    }),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
    getResourceCfnTemplatePath: jest.fn().mockReturnValue('cfn-template-path.json'),
  },
}));

describe('migrate step for removing lambda callouts', () => {
  let props: CognitoStackOptions;

  beforeEach(() => {
    props = {
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
      permissions: [],
      authProviders: ['accounts.google.com'],
      audiences: ['xxxgoogleClientIdxxx'],
      hostedUIProviderMeta:
        '[{"ProviderName":"Facebook","authorize_scopes":"email,public_profile","AttributeMapping":{"email":"email","username":"id"}},{"ProviderName":"Google","authorize_scopes":"openid email profile","AttributeMapping":{"email":"email","username":"sub"}},{"ProviderName":"LoginWithAmazon","authorize_scopes":"profile profile:user_id","AttributeMapping":{"email":"email","username":"user_id"}},{"ProviderName":"SignInWithApple","authorize_scopes":"email","AttributeMapping":{"email":"email"}}]',
      hostedUIProviderCreds:
        '[{"ProviderName":"Facebook","client_id":"sdcsdc","client_secret":"bfdsvsr"},{"ProviderName":"Google","client_id":"avearver","client_secret":"vcvereger"},{"ProviderName":"LoginWithAmazon","client_id":"vercvdsavcer","client_secret":"revfdsavrtv"},{"ProviderName":"SignInWithApple","client_id":"vfdvergver","team_id":"ervervre","key_id":"vfdavervfer","private_key":"vaveb"}]',
      hostedUIDomainName: 'domainname',
    };
  });

  describe('createHostedUIDomainResource', () => {
    it('does not create providers without "hostedUIDomainName"', async () => {
      const testApp = new cdk.App();
      const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

      delete props.hostedUIDomainName;

      cognitoStack.createHostedUIDomainResource(props);

      expect(cognitoStack.hostedUIDomainResource).toBeUndefined();
    });

    describe('when create/update lambda callouts exist', () => {
      it('creates delete lambda callout and cfn-code-created providers', () => {
        const testApp = new cdk.App();
        const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

        cognitoStack.createHostedUIDomainResource(props);

        const { hostedUICustomResource, hostedUIDomainResource } = cognitoStack;

        expect(hostedUICustomResource?.cfnResourceType).toBe('AWS::Lambda::Function');
        expect((hostedUICustomResource?.code as CfnFunction.CodeProperty).zipFile).toMatch('deleteUserPoolDomain(inputDomainName)');

        expect(hostedUIDomainResource).toBeDefined();
      });
    });
  });

  describe('createHostedUIProvidersResources', () => {
    it('does not create providers without "hostedUIProvderMeta"', async () => {
      const testApp = new cdk.App();
      const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

      delete props.hostedUIProviderMeta;

      cognitoStack.createHostedUIProvidersResources(props);

      expect(cognitoStack.hostedUIProviderResources.length).toEqual(0);
    });

    describe('when create/update lambda callouts exist', () => {
      it('creates delete lambda callout and cfn-code-created providers', () => {
        const testApp = new cdk.App();
        const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

        cognitoStack.createHostedUIProvidersResources(props);

        const { hostedUIProvidersCustomResource, hostedUIProviderResources } = cognitoStack;

        expect(hostedUIProvidersCustomResource?.cfnResourceType).toBe('AWS::Lambda::Function');
        expect((hostedUIProvidersCustomResource?.code as CfnFunction.CodeProperty).zipFile).toMatch(
          'hostedUIProviderMeta.forEach(({ ProviderName }) => providerPromises.push(deleteIdentityProvider(ProviderName)));',
        );

        expect(hostedUIProviderResources.length).toEqual(4);
      });
    });
  });

  describe('createOpenIdcResource', () => {
    describe('when create/update lambda callouts exist', () => {
      it('creates delete lambda callout and cfn-code-created provider', () => {
        const testApp = new cdk.App();
        const cognitoStack = new AmplifyAuthCognitoStack(testApp, 'testCognitoStack', { synthesizer: new AuthStackSynthesizer() });

        cognitoStack.createOpenIdcResource(props);

        const { openIdLambda, openIdcResource } = cognitoStack;

        expect(openIdLambda?.cfnResourceType).toBe('AWS::Lambda::Function');
        expect((openIdLambda?.code as CfnFunction.CodeProperty).zipFile).toMatchSnapshot();

        expect(openIdcResource?.url).toEqual('https://accounts.google.com');
      });
    });
  });
});
