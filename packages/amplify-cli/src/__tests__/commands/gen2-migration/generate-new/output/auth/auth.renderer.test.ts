import {
  AuthRenderer,
  AuthRenderOptions,
  FunctionAccess,
  AuthTrigger,
} from '../../../../../../commands/gen2-migration/generate-new/output/auth/auth.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';
import { IdentityProviderTypeType } from '@aws-sdk/client-cognito-identity-provider';

describe('AuthRenderer', () => {
  const renderer = new AuthRenderer();

  describe('standard auth', () => {
    it('renders a minimal defineAuth with email login', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('defineAuth');
      expect(output).toContain('loginWith');
      expect(output).toContain('email');
      expect(output).toContain('export const auth');
    });

    it('renders phone login', () => {
      const options: AuthRenderOptions = {
        userPool: { UsernameAttributes: ['phone_number'], SchemaAttributes: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('phone: true');
    });

    it('renders email with verification options', () => {
      const options: AuthRenderOptions = {
        userPool: {
          EmailVerificationSubject: 'Verify your account',
          EmailVerificationMessage: 'Your code is {####}',
          SchemaAttributes: [],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('verificationEmailSubject');
      expect(output).toContain('Verify your account');
      expect(output).toContain('verificationEmailBody');
      expect(output).toContain('Your code is {####}');
    });

    it('renders email options with subject only', () => {
      const options: AuthRenderOptions = {
        userPool: {
          EmailVerificationSubject: 'Welcome',
          SchemaAttributes: [],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('verificationEmailSubject');
      expect(output).toContain('Welcome');
    });

    it('renders user groups', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityGroups: [
          { GroupName: 'admin', Precedence: 1 },
          { GroupName: 'editors', Precedence: 2 },
          { GroupName: 'viewers', Precedence: 3 },
        ],
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('groups');
      expect(output).toContain("'admin'");
      expect(output).toContain("'editors'");
      expect(output).toContain("'viewers'");
    });

    it('renders standard user attributes', () => {
      const options: AuthRenderOptions = {
        userPool: {
          SchemaAttributes: [
            { Name: 'email', Required: true, Mutable: true },
            { Name: 'given_name', Required: true, Mutable: false },
          ],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('userAttributes');
      expect(output).toContain('email');
      expect(output).toContain('required: true');
      expect(output).toContain('mutable: true');
      expect(output).toContain('givenName');
    });

    it('renders custom user attributes', () => {
      const options: AuthRenderOptions = {
        userPool: {
          SchemaAttributes: [
            {
              Name: 'custom:department',
              AttributeDataType: 'String',
              Mutable: true,
              StringAttributeConstraints: { MinLength: '1', MaxLength: '50' },
            },
          ],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('userAttributes');
      expect(output).toContain('custom:department');
      expect(output).toContain("dataType: 'String'");
      expect(output).toContain('minLen: 1');
      expect(output).toContain('maxLen: 50');
    });

    it('renders MFA configuration with TOTP and SMS', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        mfaConfig: {
          MfaConfiguration: 'OPTIONAL',
          SoftwareTokenMfaConfiguration: { Enabled: true },
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('multifactor');
      expect(output).toContain("mode: 'OPTIONAL'");
      expect(output).toContain('totp: true');
      expect(output).toContain('sms: true');
    });

    it('renders MFA with REQUIRED mode', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        mfaConfig: {
          MfaConfiguration: 'ON',
          SoftwareTokenMfaConfiguration: { Enabled: true },
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain("mode: 'REQUIRED'");
      expect(output).toContain('totp: true');
      expect(output).toContain('sms: true');
    });

    it('renders lambda triggers with function imports', () => {
      const triggers: AuthTrigger[] = [
        { event: 'preSignUp', resourceName: 'preSignUpFn' },
        { event: 'postConfirmation', resourceName: 'postConfirmFn' },
      ];
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        triggers,
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('triggers');
      expect(output).toContain('preSignUp');
      expect(output).toContain('preSignUpFn');
      expect(output).toContain('postConfirmation');
      expect(output).toContain('postConfirmFn');
      expect(output).toContain("from './preSignUpFn/resource'");
      expect(output).toContain("from './postConfirmFn/resource'");
    });
  });

  describe('external providers', () => {
    it('renders Google login with secrets', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' }],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('externalProviders');
      expect(output).toContain('google');
      expect(output).toContain('GOOGLE_CLIENT_ID');
      expect(output).toContain('GOOGLE_CLIENT_SECRET');
      expect(output).toContain('secret');
      expect(output).toContain('callbackUrls');
      expect(output).toContain('logoutUrls');
      expect(output).toContain('https://example.com/callback');
    });

    it('renders Apple login with secrets', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.SignInWithApple, ProviderName: 'SignInWithApple' }],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('signInWithApple');
      expect(output).toContain('SIWA_CLIENT_ID');
      expect(output).toContain('SIWA_KEY_ID');
      expect(output).toContain('SIWA_PRIVATE_KEY');
      expect(output).toContain('SIWA_TEAM_ID');
    });

    it('renders Amazon login with secrets', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.LoginWithAmazon, ProviderName: 'LoginWithAmazon' }],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('loginWithAmazon');
      expect(output).toContain('LOGINWITHAMAZON_CLIENT_ID');
      expect(output).toContain('LOGINWITHAMAZON_CLIENT_SECRET');
    });

    it('renders Facebook login with secrets', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Facebook, ProviderName: 'Facebook' }],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('facebook');
      expect(output).toContain('FACEBOOK_CLIENT_ID');
      expect(output).toContain('FACEBOOK_CLIENT_SECRET');
    });

    it('renders Google login with scopes', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.Google,
            ProviderName: 'Google',
            ProviderDetails: { authorized_scopes: 'profile email' },
          },
        ],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('scopes');
      expect(output).toContain("'profile'");
      expect(output).toContain("'email'");
    });

    it('renders Google login with attribute mapping', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.Google,
            ProviderName: 'Google',
            AttributeMapping: { email: 'email', given_name: 'given_name' },
          },
        ],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('attributeMapping');
      expect(output).toContain("email: 'email'");
      expect(output).toContain("givenName: 'given_name'");
    });

    it('renders OIDC provider', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.OIDC,
            ProviderName: 'MyOIDC',
            ProviderDetails: {
              oidc_issuer: 'https://accounts.google.com',
              authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
              token_url: 'https://oauth2.googleapis.com/token',
              attributes_url: 'https://openidconnect.googleapis.com/v1/userinfo',
              jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
            },
          },
        ],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('oidc');
      expect(output).toContain('OIDC_CLIENT_ID_1');
      expect(output).toContain('OIDC_CLIENT_SECRET_1');
      expect(output).toContain("issuerUrl: 'https://accounts.google.com'");
      expect(output).toContain("name: 'MyOIDC'");
    });

    it('renders SAML provider', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.SAML,
            ProviderName: 'MySAML',
            ProviderDetails: {
              metadataURL: 'https://idp.example.com/metadata',
            },
          },
        ],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('saml');
      expect(output).toContain("name: 'MySAML'");
      expect(output).toContain("metadataContent: 'https://idp.example.com/metadata'");
      expect(output).toContain("metadataType: 'URL'");
    });

    it('renders multiple providers together', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          { ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' },
          { ProviderType: IdentityProviderTypeType.Facebook, ProviderName: 'Facebook' },
          { ProviderType: IdentityProviderTypeType.SignInWithApple, ProviderName: 'SignInWithApple' },
        ],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('google');
      expect(output).toContain('facebook');
      expect(output).toContain('signInWithApple');
    });
  });

  describe('function access', () => {
    it('renders function auth access rules', () => {
      const access: FunctionAccess[] = [
        {
          resourceName: 'adminFunc',
          permissions: { manageUsers: true, listUsers: true },
        },
      ];
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        access,
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('access');
      expect(output).toContain('allow');
      expect(output).toContain('adminFunc');
      expect(output).toContain("'manageUsers'");
      expect(output).toContain("'listUsers'");
      expect(output).toContain("from '../function/adminFunc/resource'");
    });

    it('renders multiple functions with auth access', () => {
      const access: FunctionAccess[] = [
        { resourceName: 'func1', permissions: { createUser: true } },
        { resourceName: 'func2', permissions: { deleteUser: true, getUser: true } },
      ];
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        access,
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('func1');
      expect(output).toContain('func2');
      expect(output).toContain("'createUser'");
      expect(output).toContain("'deleteUser'");
      expect(output).toContain("'getUser'");
    });

    it('skips functions with empty auth access', () => {
      const access: FunctionAccess[] = [{ resourceName: 'noAccessFunc', permissions: {} }];
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        access,
      };
      const output = printNodes(renderer.render(options));

      expect(output).not.toContain('access');
      expect(output).not.toContain('noAccessFunc');
    });
  });

  describe('empty/minimal definitions', () => {
    it('renders with no login options', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).toContain('defineAuth');
      expect(output).toContain('loginWith');
    });

    it('does not render MFA when not provided', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).not.toContain('multifactor');
    });

    it('does not render triggers when not provided', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
      };
      const output = printNodes(renderer.render(options));

      expect(output).not.toContain('triggers');
    });

    it('does not render groups when empty', () => {
      const options: AuthRenderOptions = {
        userPool: { SchemaAttributes: [] },
        identityGroups: [],
      };
      const output = printNodes(renderer.render(options));

      expect(output).not.toContain('groups');
    });
  });
});
