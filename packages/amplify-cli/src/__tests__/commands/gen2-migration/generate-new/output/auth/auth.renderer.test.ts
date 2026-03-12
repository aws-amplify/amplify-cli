import { AuthRenderer, AuthDefinition } from '../../../../../../commands/gen2-migration/generate-new/output/auth/auth.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('AuthRenderer', () => {
  const renderer = new AuthRenderer();

  describe('standard auth', () => {
    it('renders a minimal defineAuth with email login', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('defineAuth');
      expect(output).toContain('loginWith');
      expect(output).toContain('email: true');
      expect(output).toContain('export const auth');
    });

    it('renders phone login', () => {
      const definition: AuthDefinition = {
        loginOptions: { phone: true },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('phone: true');
    });

    it('renders email with verification options', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          emailOptions: {
            emailVerificationSubject: 'Verify your account',
            emailVerificationBody: 'Your code is {####}',
          },
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('verificationEmailSubject');
      expect(output).toContain('Verify your account');
      expect(output).toContain('verificationEmailBody');
      expect(output).toContain('Your code is {####}');
    });

    it('renders email options without email flag', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          emailOptions: {
            emailVerificationSubject: 'Welcome',
          },
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('verificationEmailSubject');
      expect(output).toContain('Welcome');
    });

    it('renders user groups', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        groups: ['admin', 'editors', 'viewers'],
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('groups');
      expect(output).toContain("'admin'");
      expect(output).toContain("'editors'");
      expect(output).toContain("'viewers'");
    });

    it('renders standard user attributes', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        standardUserAttributes: {
          email: { required: true, mutable: true },
          givenName: { required: false },
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('userAttributes');
      expect(output).toContain('email');
      expect(output).toContain('required: true');
      expect(output).toContain('mutable: true');
      expect(output).toContain('givenName');
    });

    it('renders custom user attributes', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        customUserAttributes: {
          'custom:department': { dataType: 'String', mutable: true, minLen: 1, maxLen: 50 },
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('userAttributes');
      expect(output).toContain('custom:department');
      expect(output).toContain("dataType: 'String'");
      expect(output).toContain('minLen: 1');
      expect(output).toContain('maxLen: 50');
    });

    it('renders MFA configuration with TOTP and SMS', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        mfa: { mode: 'OPTIONAL', totp: true, sms: true },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('multifactor');
      expect(output).toContain("mode: 'OPTIONAL'");
      expect(output).toContain('totp: true');
      expect(output).toContain('sms: true');
    });

    it('renders MFA with REQUIRED mode', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        mfa: { mode: 'REQUIRED', totp: true, sms: false },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain("mode: 'REQUIRED'");
      expect(output).toContain('totp: true');
      expect(output).toContain('sms: false');
    });

    it('renders lambda triggers with function imports', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        lambdaTriggers: {
          preSignUp: { source: 'amplify/backend/function/preSignUpFn/src' },
          postConfirmation: { source: 'amplify/backend/function/postConfirmFn/src' },
        },
      };
      const output = printNodes(renderer.render(definition));

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
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          googleLogin: true,
          callbackURLs: ['https://example.com/callback'],
          logoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(definition));

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
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          appleLogin: true,
          callbackURLs: ['https://example.com/callback'],
          logoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('signInWithApple');
      expect(output).toContain('SIWA_CLIENT_ID');
      expect(output).toContain('SIWA_KEY_ID');
      expect(output).toContain('SIWA_PRIVATE_KEY');
      expect(output).toContain('SIWA_TEAM_ID');
    });

    it('renders Amazon login with secrets', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          amazonLogin: true,
          callbackURLs: [],
          logoutURLs: [],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('loginWithAmazon');
      expect(output).toContain('LOGINWITHAMAZON_CLIENT_ID');
      expect(output).toContain('LOGINWITHAMAZON_CLIENT_SECRET');
    });

    it('renders Facebook login with secrets', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          facebookLogin: true,
          callbackURLs: [],
          logoutURLs: [],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('facebook');
      expect(output).toContain('FACEBOOK_CLIENT_ID');
      expect(output).toContain('FACEBOOK_CLIENT_SECRET');
    });

    it('renders Google login with scopes', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          googleLogin: true,
          googleScopes: ['profile', 'email'],
          callbackURLs: [],
          logoutURLs: [],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('scopes');
      expect(output).toContain("'profile'");
      expect(output).toContain("'email'");
    });

    it('renders Google login with attribute mapping', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          googleLogin: true,
          googleAttributes: { email: 'email', givenName: 'given_name' } as any,
          callbackURLs: [],
          logoutURLs: [],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('attributeMapping');
      expect(output).toContain("email: 'email'");
      expect(output).toContain("givenName: 'given_name'");
    });

    it('renders OIDC provider', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          oidcLogin: [
            {
              issuerUrl: 'https://accounts.google.com',
              name: 'MyOIDC',
              endpoints: {
                authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
                token: 'https://oauth2.googleapis.com/token',
              },
            },
          ],
          callbackURLs: ['https://example.com/callback'],
          logoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('oidc');
      expect(output).toContain('OIDC_CLIENT_ID_1');
      expect(output).toContain('OIDC_CLIENT_SECRET_1');
      expect(output).toContain("issuerUrl: 'https://accounts.google.com'");
      expect(output).toContain("name: 'MyOIDC'");
    });

    it('renders SAML provider', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          samlLogin: {
            name: 'MySAML',
            metadata: {
              metadataContent: 'https://idp.example.com/metadata',
              metadataType: 'URL',
            },
          },
          callbackURLs: ['https://example.com/callback'],
          logoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('saml');
      expect(output).toContain("name: 'MySAML'");
      expect(output).toContain("metadataContent: 'https://idp.example.com/metadata'");
      expect(output).toContain("metadataType: 'URL'");
    });

    it('renders multiple providers together', () => {
      const definition: AuthDefinition = {
        loginOptions: {
          email: true,
          googleLogin: true,
          facebookLogin: true,
          appleLogin: true,
          callbackURLs: ['https://example.com/callback'],
          logoutURLs: ['https://example.com/logout'],
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('google');
      expect(output).toContain('facebook');
      expect(output).toContain('signInWithApple');
    });
  });

  describe('function access', () => {
    it('renders function auth access rules', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        functions: [
          {
            resourceName: 'adminFunc',
            authAccess: { manageUsers: true, listUsers: true },
          },
        ],
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('access');
      expect(output).toContain('allow');
      expect(output).toContain('adminFunc');
      expect(output).toContain("'manageUsers'");
      expect(output).toContain("'listUsers'");
      expect(output).toContain("from '../function/adminFunc/resource'");
    });

    it('renders multiple functions with auth access', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        functions: [
          { resourceName: 'func1', authAccess: { createUser: true } },
          { resourceName: 'func2', authAccess: { deleteUser: true, getUser: true } },
        ],
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('func1');
      expect(output).toContain('func2');
      expect(output).toContain("'createUser'");
      expect(output).toContain("'deleteUser'");
      expect(output).toContain("'getUser'");
    });

    it('skips functions with empty auth access', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        functions: [{ resourceName: 'noAccessFunc', authAccess: {} }],
      };
      const output = printNodes(renderer.render(definition));

      expect(output).not.toContain('access');
      expect(output).not.toContain('noAccessFunc');
    });
  });

  describe('reference auth', () => {
    it('renders referenceAuth with user pool and identity pool', () => {
      const definition: AuthDefinition = {
        referenceAuth: {
          userPoolId: 'us-east-1_abc123',
          identityPoolId: 'us-east-1:12345-abcde',
          authRoleArn: 'arn:aws:iam::123456789:role/authRole',
          unauthRoleArn: 'arn:aws:iam::123456789:role/unauthRole',
          userPoolClientId: 'client123',
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('referenceAuth');
      expect(output).not.toContain('defineAuth');
      expect(output).toContain("userPoolId: 'us-east-1_abc123'");
      expect(output).toContain("identityPoolId: 'us-east-1:12345-abcde'");
      expect(output).toContain('authRoleArn');
      expect(output).toContain('unauthRoleArn');
      expect(output).toContain("userPoolClientId: 'client123'");
    });

    it('renders referenceAuth with groups', () => {
      const definition: AuthDefinition = {
        referenceAuth: {
          userPoolId: 'us-east-1_abc123',
          groups: {
            admin: 'arn:aws:iam::123456789:role/adminRole',
            editors: 'arn:aws:iam::123456789:role/editorsRole',
          },
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('referenceAuth');
      expect(output).toContain('groups');
      expect(output).toContain('admin');
      expect(output).toContain('editors');
    });

    it('renders referenceAuth with partial properties', () => {
      const definition: AuthDefinition = {
        referenceAuth: {
          userPoolId: 'us-east-1_abc123',
        },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('referenceAuth');
      expect(output).toContain("userPoolId: 'us-east-1_abc123'");
      expect(output).not.toContain('identityPoolId');
      expect(output).not.toContain('authRoleArn');
    });
  });

  describe('empty/minimal definitions', () => {
    it('renders with no login options', () => {
      const definition: AuthDefinition = {};
      const output = printNodes(renderer.render(definition));

      expect(output).toContain('defineAuth');
      expect(output).toContain('loginWith');
    });

    it('does not render MFA when not provided', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).not.toContain('multifactor');
    });

    it('does not render triggers when not provided', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
      };
      const output = printNodes(renderer.render(definition));

      expect(output).not.toContain('triggers');
    });

    it('does not render groups when empty', () => {
      const definition: AuthDefinition = {
        loginOptions: { email: true },
        groups: [],
      };
      const output = printNodes(renderer.render(definition));

      expect(output).not.toContain('groups');
    });
  });
});
