import {
  AuthRenderer,
  AuthRenderOptions,
  FunctionAccess,
  AuthTrigger,
} from '../../../../../../commands/gen2-migration/generate-new/amplify/auth/auth.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate-new/_infra/ts';
import { IdentityProviderTypeType } from '@aws-sdk/client-cognito-identity-provider';

describe('AuthRenderer', () => {
  const renderer = new AuthRenderer();

  function render(options: AuthRenderOptions): string {
    return TS.printNodes(renderer.render(options));
  }

  describe('standard auth', () => {
    it('renders a minimal defineAuth with email login', () => {
      const output = render({ userPool: { SchemaAttributes: [] } });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders phone login', () => {
      const output = render({
        userPool: { UsernameAttributes: ['phone_number'], SchemaAttributes: [] },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders email with verification options', () => {
      const output = render({
        userPool: {
          EmailVerificationSubject: 'Verify your account',
          EmailVerificationMessage: 'Your code is {####}',
          SchemaAttributes: [],
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: {
              verificationEmailSubject: 'Verify your account',
              verificationEmailBody: () => 'Your code is {####}',
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders user groups', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityGroups: [
          { GroupName: 'admin', Precedence: 1 },
          { GroupName: 'editors', Precedence: 2 },
          { GroupName: 'viewers', Precedence: 3 },
        ],
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          groups: ['admin', 'editors', 'viewers'],
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders standard user attributes', () => {
      const output = render({
        userPool: {
          SchemaAttributes: [
            { Name: 'email', Required: true, Mutable: true },
            { Name: 'given_name', Required: true, Mutable: false },
          ],
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          userAttributes: {
            email: {
              required: true,
              mutable: true,
            },
            givenName: {
              required: true,
              mutable: false,
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders custom user attributes', () => {
      const output = render({
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
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          userAttributes: {
            'custom:department': {
              mutable: true,
              dataType: 'String',
              minLen: 1,
              maxLen: 50,
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders MFA configuration with TOTP and SMS', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        mfaConfig: {
          MfaConfiguration: 'OPTIONAL',
          SoftwareTokenMfaConfiguration: { Enabled: true },
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OPTIONAL',
            totp: true,
            sms: true,
          },
        });
        "
      `);
    });

    it('renders MFA with REQUIRED mode', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        mfaConfig: {
          MfaConfiguration: 'ON',
          SoftwareTokenMfaConfiguration: { Enabled: true },
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'REQUIRED',
            totp: true,
            sms: true,
          },
        });
        "
      `);
    });

    it('renders lambda triggers with function imports', () => {
      const triggers: AuthTrigger[] = [
        { event: 'preSignUp', resourceName: 'preSignUpFn' },
        { event: 'postConfirmation', resourceName: 'postConfirmFn' },
      ];
      const output = render({
        userPool: { SchemaAttributes: [] },
        triggers,
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';
        import { preSignUpFn } from './preSignUpFn/resource';
        import { postConfirmFn } from './postConfirmFn/resource';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          triggers: {
            preSignUp: preSignUpFn,
            postConfirmation: postConfirmFn,
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });
  });

  describe('external providers', () => {
    it('renders Google login with secrets', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' }],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              google: {
                clientId: secret('GOOGLE_CLIENT_ID'),
                clientSecret: secret('GOOGLE_CLIENT_SECRET'),
              },
              callbackUrls: ['https://example.com/callback'],
              logoutUrls: ['https://example.com/logout'],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders Apple login with secrets', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.SignInWithApple, ProviderName: 'SignInWithApple' }],
        webClient: {
          CallbackURLs: ['https://example.com/callback'],
          LogoutURLs: ['https://example.com/logout'],
        },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              signInWithApple: {
                clientId: secret('SIWA_CLIENT_ID'),
                keyId: secret('SIWA_KEY_ID'),
                privateKey: secret('SIWA_PRIVATE_KEY'),
                teamId: secret('SIWA_TEAM_ID'),
              },
              callbackUrls: ['https://example.com/callback'],
              logoutUrls: ['https://example.com/logout'],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders Amazon login with secrets', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.LoginWithAmazon, ProviderName: 'LoginWithAmazon' }],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              loginWithAmazon: {
                clientId: secret('LOGINWITHAMAZON_CLIENT_ID'),
                clientSecret: secret('LOGINWITHAMAZON_CLIENT_SECRET'),
              },
              callbackUrls: [],
              logoutUrls: [],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders Facebook login with secrets', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Facebook, ProviderName: 'Facebook' }],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              facebook: {
                clientId: secret('FACEBOOK_CLIENT_ID'),
                clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
              },
              callbackUrls: [],
              logoutUrls: [],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders Google login with scopes', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.Google,
            ProviderName: 'Google',
            ProviderDetails: { authorized_scopes: 'profile email' },
          },
        ],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              google: {
                clientId: secret('GOOGLE_CLIENT_ID'),
                clientSecret: secret('GOOGLE_CLIENT_SECRET'),
                scopes: ['profile', 'email'],
              },
              callbackUrls: [],
              logoutUrls: [],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders Google login with attribute mapping', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityProviders: [
          {
            ProviderType: IdentityProviderTypeType.Google,
            ProviderName: 'Google',
            AttributeMapping: { email: 'email', given_name: 'given_name' },
          },
        ],
        webClient: { CallbackURLs: [], LogoutURLs: [] },
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              google: {
                clientId: secret('GOOGLE_CLIENT_ID'),
                clientSecret: secret('GOOGLE_CLIENT_SECRET'),
                attributeMapping: {
                  email: 'email',
                  givenName: 'given_name',
                },
              },
              callbackUrls: [],
              logoutUrls: [],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders OIDC provider', () => {
      const output = render({
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
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              oidc: [
                {
                  clientId: secret('OIDC_CLIENT_ID_1'),
                  clientSecret: secret('OIDC_CLIENT_SECRET_1'),
                  issuerUrl: 'https://accounts.google.com',
                  name: 'MyOIDC',
                  endpoints: {
                    authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
                    token: 'https://oauth2.googleapis.com/token',
                    userInfo: 'https://openidconnect.googleapis.com/v1/userinfo',
                    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
                  },
                },
              ],
              callbackUrls: ['https://example.com/callback'],
              logoutUrls: ['https://example.com/logout'],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders SAML provider', () => {
      const output = render({
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
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              saml: {
                metadata: {
                  metadataContent: 'https://idp.example.com/metadata',
                  metadataType: 'URL',
                },
                name: 'MySAML',
              },
              callbackUrls: ['https://example.com/callback'],
              logoutUrls: ['https://example.com/logout'],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
    });

    it('renders multiple providers together', () => {
      const output = render({
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
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth, secret } from '@aws-amplify/backend';

        export const auth = defineAuth({
          loginWith: {
            email: true,
            externalProviders: {
              google: {
                clientId: secret('GOOGLE_CLIENT_ID'),
                clientSecret: secret('GOOGLE_CLIENT_SECRET'),
              },
              signInWithApple: {
                clientId: secret('SIWA_CLIENT_ID'),
                keyId: secret('SIWA_KEY_ID'),
                privateKey: secret('SIWA_PRIVATE_KEY'),
                teamId: secret('SIWA_TEAM_ID'),
              },
              facebook: {
                clientId: secret('FACEBOOK_CLIENT_ID'),
                clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
              },
              callbackUrls: ['https://example.com/callback'],
              logoutUrls: ['https://example.com/logout'],
            },
          },
          multifactor: {
            mode: 'OFF',
          },
        });
        "
      `);
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
      const output = render({
        userPool: { SchemaAttributes: [] },
        access,
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';
        import { adminFunc } from '../function/adminFunc/resource';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OFF',
          },
          access: (allow, _unused) => [
            allow.resource(adminFunc).to(['manageUsers']),
            allow.resource(adminFunc).to(['listUsers']),
          ],
        });
        "
      `);
    });

    it('renders multiple functions with auth access', () => {
      const access: FunctionAccess[] = [
        { resourceName: 'func1', permissions: { createUser: true } },
        { resourceName: 'func2', permissions: { deleteUser: true, getUser: true } },
      ];
      const output = render({
        userPool: { SchemaAttributes: [] },
        access,
      });

      expect(output).toMatchInlineSnapshot(`
        "import { defineAuth } from '@aws-amplify/backend';
        import { func1 } from '../function/func1/resource';
        import { func2 } from '../function/func2/resource';

        export const auth = defineAuth({
          loginWith: {
            email: true,
          },
          multifactor: {
            mode: 'OFF',
          },
          access: (allow, _unused) => [
            allow.resource(func1).to(['createUser']),
            allow.resource(func2).to(['deleteUser']),
            allow.resource(func2).to(['getUser']),
          ],
        });
        "
      `);
    });

    it('skips functions with empty auth access', () => {
      const access: FunctionAccess[] = [{ resourceName: 'noAccessFunc', permissions: {} }];
      const output = render({
        userPool: { SchemaAttributes: [] },
        access,
      });

      expect(output).not.toContain('access');
      expect(output).not.toContain('noAccessFunc');
    });
  });

  describe('empty/minimal definitions', () => {
    it('renders MFA OFF when not provided', () => {
      const output = render({ userPool: { SchemaAttributes: [] } });

      expect(output).toContain('multifactor');
      expect(output).toContain("mode: 'OFF'");
    });

    it('does not render triggers when not provided', () => {
      const output = render({ userPool: { SchemaAttributes: [] } });

      expect(output).not.toContain('triggers');
    });

    it('does not render groups when empty', () => {
      const output = render({
        userPool: { SchemaAttributes: [] },
        identityGroups: [],
      });

      expect(output).not.toContain('groups');
    });
  });
});
