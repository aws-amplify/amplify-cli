import { generateNestedStackParameters } from '../../../../provider-utils/awscloudformation/utils/generate-nested-stack-parameters';

describe('generateNestedStackParameters', () => {
  const hostedUIProviderCreds = [
    {
      ProviderName: 'Facebook',
      client_id: 'sdcsdc',
      client_secret: 'bfdsvsr',
    },
    {
      ProviderName: 'Google',
      client_id: 'avearver',
      client_secret: 'vcvereger',
    },
    {
      ProviderName: 'LoginWithAmazon',
      client_id: 'vercvdsavcer',
      client_secret: 'revfdsavrtv',
    },
    {
      ProviderName: 'SignInWithApple',
      client_id: 'vfdvergver',
      team_id: 'ervervre',
      key_id: 'vfdavervfer',
      private_key: 'vaveb',
    },
  ];

  const hostedUIProviderMeta = [
    {
      ProviderName: 'Facebook',
      authorize_scopes: 'email,public_profile',
      AttributeMapping: { email: 'email', username: 'id' },
    },
    {
      ProviderName: 'Google',
      authorize_scopes: 'openid email profile',
      AttributeMapping: { email: 'email', username: 'sub' },
    },
    {
      ProviderName: 'LoginWithAmazon',
      authorize_scopes: 'profile profile:user_id',
      AttributeMapping: { email: 'email', username: 'user_id' },
    },
    {
      ProviderName: 'SignInWithApple',
      authorize_scopes: 'email',
      AttributeMapping: { email: 'email' },
    },
  ];

  it('generates expected parameters object', () => {
    expect(generateNestedStackParameters(hostedUIProviderMeta, hostedUIProviderCreds)).toEqual({
      facebookAuthorizeScopes: 'email,public_profile',
      facebookAppIdUserPool: 'sdcsdc',
      facebookAppSecretUserPool: 'bfdsvsr',
      googleAuthorizeScopes: 'openid email profile',
      googleAppIdUserPool: 'avearver',
      googleAppSecretUserPool: 'vcvereger',
      loginwithamazonAuthorizeScopes: 'profile profile:user_id',
      loginwithamazonAppIdUserPool: 'vercvdsavcer',
      loginwithamazonAppSecretUserPool: 'revfdsavrtv',
      signinwithappleAuthorizeScopes: 'email',
      signinwithappleClientIdUserPool: 'vfdvergver',
      signinwithappleKeyIdUserPool: 'vfdavervfer',
      signinwithapplePrivateKeyUserPool: 'vaveb',
      signinwithappleTeamIdUserPool: 'ervervre',
    });
  });
});
