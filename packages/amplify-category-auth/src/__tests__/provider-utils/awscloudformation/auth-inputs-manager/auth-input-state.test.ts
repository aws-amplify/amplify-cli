import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';

jest.mock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockbackendDirPath'),
    findProjectRoot: jest.fn().mockReturnValue('mockProject'),
  },
  JSONUtilities: {
    readJson: jest
      .fn()
      .mockReturnValueOnce({
        cognitoConfig: {
          identityPoolName: 'extauth387063394_identitypool_87063394',
          allowUnauthenticatedIdentities: true,
          resourceNameTruncated: 'extaut87063394',
          userPoolName: 'extauth387063394_userpool_87063394',
          autoVerifiedAttributes: ['email'],
          mfaConfiguration: 'ON',
          mfaTypes: ['SMS Text Message', 'TOTP'],
          smsAuthenticationMessage: 'Your authentication code is {####}',
          smsVerificationMessage: 'Your verification code is {####}',
          emailVerificationSubject: 'Your verification code',
          emailVerificationMessage: 'Your verification code is {####}',
          defaultPasswordPolicy: true,
          passwordPolicyMinLength: 8,
          passwordPolicyCharacters: ['Requires Lowercase', 'Requires Uppercase', 'Requires Numbers', 'Requires Symbols'],
          requiredAttributes: ['email'],
          userpoolClientRefreshTokenValidity: 30,
          userpoolClientWriteAttributes: ['address', 'email'],
          userpoolClientReadAttributes: ['address', 'email'],
          userpoolClientLambdaRole: 'extaut87063394_userpoolclient_lambda_role',
          userpoolClientSetAttributes: true,
          userpoolClientGenerateSecret: false,
          sharedId: '87063394',
          resourceName: 'extauth38706339487063394',
          authSelections: 'identityPoolAndUserPool',
          authRoleArn: {
            'Fn::GetAtt': ['AuthRole', 'Arn'],
          },
          unauthRoleArn: {
            'Fn::GetAtt': ['UnauthRole', 'Arn'],
          },
          useDefault: 'manual',
          thirdPartyAuth: true,
          authProviders: ['graph.facebook.com', 'accounts.google.com', 'www.amazon.com', 'appleid.apple.com'],
          facebookAppId: 'dfvsdcsdc',
          googleClientId: 'svsdvsv',
          amazonAppId: 'sdsafggas',
          appleAppId: 'gfdbvafergew',
          userPoolGroups: true,
          adminQueries: false,
          triggers: {
            CreateAuthChallenge: ['captcha-create-challenge'],
            CustomMessage: ['verification-link'],
            DefineAuthChallenge: ['captcha-define-challenge'],
            PostAuthentication: ['custom'],
            PostConfirmation: ['add-to-group'],
            PreAuthentication: ['custom'],
            PreSignup: ['email-filter-allowlist'],
            VerifyAuthChallengeResponse: ['captcha-verify'],
            PreTokenGeneration: ['alter-claims'],
          },
          hostedUI: true,
          hostedUIDomainName: 'extauth387063394-87063394',
          newCallbackURLs: ['https://localhost:3000/'],
          newLogoutURLs: ['https://localhost:3000/'],
          AllowedOAuthFlows: 'code',
          AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
          authProvidersUserPool: ['Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'],
          facebookAppIdUserPool: 'sdcsdc',
          facebookAppSecretUserPool: 'bfdsvsr',
          googleAppIdUserPool: 'avearver',
          googleAppSecretUserPool: 'vcvereger',
          loginwithamazonAppIdUserPool: 'vercvdsavcer',
          loginwithamazonAppSecretUserPool: 'revfdsavrtv',
          signinwithappleClientIdUserPool: 'vfdvergver',
          signinwithappleTeamIdUserPool: 'ervervre',
          signinwithappleKeyIdUserPool: 'vfdavervfer',
          signinwithapplePrivateKeyUserPool: 'vaveb',
          selectedParties:
            '{"graph.facebook.com":"dfvsdcsdc","accounts.google.com":"svsdvsv","www.amazon.com":"sdsafggas","appleid.apple.com":"gfdbvafergew"}',
          hostedUIProviderMeta:
            '[{"ProviderName":"Facebook","authorize_scopes":"email,public_profile","AttributeMapping":{"email":"email","username":"id"}},{"ProviderName":"Google","authorize_scopes":"openid email profile","AttributeMapping":{"email":"email","username":"sub"}},{"ProviderName":"LoginWithAmazon","authorize_scopes":"profile profile:user_id","AttributeMapping":{"email":"email","username":"user_id"}},{"ProviderName":"SignInWithApple","authorize_scopes":"email","AttributeMapping":{"email":"email"}}]',
          oAuthMetadata:
            '{"AllowedOAuthFlows":["code"],"AllowedOAuthScopes":["phone","email","openid","profile","aws.cognito.signin.user.admin"],"CallbackURLs":["https://localhost:3000/"],"LogoutURLs":["https://localhost:3000/"]}',
          userPoolGroupList: ['adin'],
          serviceName: 'Cognito',
          verificationBucketName: 'extauth38706339487063394verificationbucket',
          usernameCaseSensitive: false,
        },
      })
      .mockReturnValueOnce({}),
    parse: JSON.parse,
  },
}));

const mockContext: $TSContext = {
  amplify: {
    getCategoryPluginInfo: (_context: $TSContext, category: string) => {
      return {
        packageLocation: `@aws-amplify/amplify-category-${category}`,
      };
    },
  },
  input: {
    options: {},
  },
} as unknown as $TSContext;

test('Auth Input State -> validate cli payload manual payload', async () => {
  const resourceName = 'mockResource';
  const authState = new AuthInputState(mockContext, resourceName);
  expect(await authState.isCLIInputsValid()).toBe(true);
});

test('Auth Input State -> validate cli payload manual payload to throw error', async () => {
  const resourceName = 'mockResource';
  const authState = new AuthInputState(mockContext, resourceName);
  await expect(authState.isCLIInputsValid()).rejects.toThrowError();
});
