import { StandardAttributes } from 'aws-cdk-lib/aws-cognito';
import assert from 'node:assert';
import {
  Attribute,
  AttributeMappingRule,
  AuthDefinition,
  AuthTriggerEvents,
  EmailOptions,
  renderAuthNode,
  UserPoolMfaConfig,
} from './source_builder';
import { printNodeArray } from '../test_utils/ts_node_printer';

describe('render auth node', () => {
  describe('external providers', () => {
    describe('Google', () => {
      it('renders the google provider', () => {
        const rendered = renderAuthNode({
          loginOptions: { googleLogin: true, callbackURLs: ['https://example.com/callback'], logoutURLs: ['https://example.com/logout'] },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /google:/);
        assert.match(source, /clientId: secret\("GOOGLE_CLIENT_ID"\)/);
        assert.match(source, /clientSecret: secret\("GOOGLE_CLIENT_SECRET"\)/);
        assert.match(source, /callbackUrls: \[\"https:\/\/example\.com\/callback\"\]/);
        assert.match(source, /logoutUrls: \[\"https:\/\/example\.com\/logout\"\]/);
      });
    });
    describe('Facebook', () => {
      it('renders the facebook provider', () => {
        const rendered = renderAuthNode({
          loginOptions: { facebookLogin: true, callbackURLs: ['https://example.com/callback'], logoutURLs: ['https://example.com/logout'] },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /facebook:/);
        assert.match(source, /clientId: secret\("FACEBOOK_CLIENT_ID"\)/);
        assert.match(source, /clientSecret: secret\("FACEBOOK_CLIENT_SECRET"\)/);
        assert.match(source, /callbackUrls: \[\"https:\/\/example\.com\/callback\"\]/);
        assert.match(source, /logoutUrls: \[\"https:\/\/example\.com\/logout\"\]/);
      });
    });
    describe('Apple', () => {
      it('renders the apple provider', () => {
        const rendered = renderAuthNode({
          loginOptions: { appleLogin: true, callbackURLs: ['https://example.com/callback'], logoutURLs: ['https://example.com/logout'] },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /signInWithApple:/);
        assert.match(source, /clientId: secret\("SIWA_CLIENT_ID"\)/);
        assert.match(source, /keyId: secret\("SIWA_KEY_ID"\)/);
        assert.match(source, /privateKey: secret\("SIWA_PRIVATE_KEY"\)/);
        assert.match(source, /teamId: secret\("SIWA_TEAM_ID"\)/);
        assert.match(source, /callbackUrls: \[\"https:\/\/example\.com\/callback\"\]/);
        assert.match(source, /logoutUrls: \[\"https:\/\/example\.com\/logout\"\]/);
      });
    });
    describe('Amazon', () => {
      it('renders the amazon provider', () => {
        const rendered = renderAuthNode({
          loginOptions: { amazonLogin: true, callbackURLs: ['https://example.com/callback'], logoutURLs: ['https://example.com/logout'] },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /loginWithAmazon:/);
        assert.match(source, /clientId: secret\("LOGINWITHAMAZON_CLIENT_ID"\)/);
        assert.match(source, /clientSecret: secret\("LOGINWITHAMAZON_CLIENT_SECRET"\)/);
        assert.match(source, /callbackUrls: \[\"https:\/\/example\.com\/callback\"\]/);
        assert.match(source, /logoutUrls: \[\"https:\/\/example\.com\/logout\"\]/);
      });
    });
    describe('OIDC', () => {
      it('renders the oidc provider', () => {
        const rendered = renderAuthNode({
          loginOptions: {
            oidcLogin: [{ issuerUrl: 'https://e' }, { name: 'Sanay', issuerUrl: 'hey' }],
            callbackURLs: ['https://example.com/callback'],
            logoutURLs: ['https://example.com/logout'],
          },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /oidc:/);
        assert.match(source, /clientId: secret\("OIDC_CLIENT_ID_1"\)/);
        assert.match(source, /clientSecret: secret\("OIDC_CLIENT_SECRET_1"\)/);
        assert.match(source, /issuerUrl: \"https:\/\/e\"/);
        assert.match(source, /issuerUrl: \"hey\"/);
        assert.match(source, /name: "Sanay"/);
      });
      it('does not render OIDC if not passed', () => {
        const rendered = renderAuthNode({
          loginOptions: {
            oidcLogin: [],
          },
        });
        const source = printNodeArray(rendered);
        assert(!source.includes('oidc:'));
      });
    });
    describe('SAML', () => {
      it('renders the saml provider', () => {
        const rendered = renderAuthNode({
          loginOptions: {
            samlLogin: { name: 'Sanay', metadata: { metadataContent: 'content', metadataType: 'URL' } },
            callbackURLs: ['https://example.com/callback'],
            logoutURLs: ['https://example.com/logout'],
          },
        });
        const source = printNodeArray(rendered);
        assert.match(source, /saml:/);
        assert.match(source, /metadataContent: \"content\"/);
        assert.match(source, /metadataType: \"URL\"/);
        assert.match(source, /name: "Sanay"/);
      });
      it('does not render SAML if not passed', () => {
        const rendered = renderAuthNode({
          loginOptions: {},
        });
        const source = printNodeArray(rendered);
        assert(!source.includes('saml:'));
      });
    });
  });
  describe('lambda', () => {
    it('adds a triggers object when a lambda trigger is defined', () => {
      const rendered = renderAuthNode({ lambdaTriggers: { preSignUp: { source: 'amplify/backend/function/testfunction/handler.ts' } } });
      const source = printNodeArray(rendered);
      assert.match(source, /triggers: \{/);
    });
    const testCases: Record<AuthTriggerEvents, boolean> = {
      createAuthChallenge: true,
      customMessage: true,
      defineAuthChallenge: true,
      postAuthentication: true,
      postConfirmation: true,
      preAuthentication: true,
      preSignUp: true,
      preTokenGeneration: true,
      userMigration: true,
      verifyAuthChallengeResponse: true,
    };
    for (const testCase of Object.keys(testCases)) {
      const rendered = renderAuthNode({ lambdaTriggers: { [testCase]: { source: `amplify/backend/function/${testCase}/handler.ts` } } });
      const source = printNodeArray(rendered);
      assert.match(source, new RegExp(`triggers:\\s*{\\s*${testCase}:\\s*${testCase}\\s*}`));
    }
  });
  describe('mfa', () => {
    it('does not render the multifactor property if no multifactor options are specified', () => {
      const rendered = renderAuthNode({});
      const source = printNodeArray(rendered);
      assert.doesNotMatch(source, new RegExp(`multifactor:`));
    });
    describe('totp', () => {
      it('does not render totp if totp is not specified', () => {
        const rendered = renderAuthNode({ mfa: { mode: 'OPTIONAL' } });
        const source = printNodeArray(rendered);
        assert.doesNotMatch(source, new RegExp(`multifactor:\\s+\\{[\\s\\S]*totp:\\strue`));
      });
      const totpStates: boolean[] = [true, false];
      for (const state of totpStates) {
        it(`correctly renders totp state of ${state}`, async () => {
          const rendered = renderAuthNode({ mfa: { mode: 'OPTIONAL', totp: state } });
          const source = printNodeArray(rendered);
          assert.match(source, new RegExp(`multifactor:\\s+\\{[\\s\\S]*totp:\\s${state}`));
        });
      }
    });
    describe('sms', () => {
      it('does not render sms if sms is not specified', () => {
        const rendered = renderAuthNode({ mfa: { mode: 'OPTIONAL' } });
        const source = printNodeArray(rendered);
        assert.doesNotMatch(source, new RegExp(`multifactor:\\s+\\{[\\s\\S]*sms:\\strue`));
      });
      const smsStates: boolean[] = [true, false];
      for (const state of smsStates) {
        it(`correctly renders sms state of ${state}`, async () => {
          const rendered = renderAuthNode({ mfa: { mode: 'OPTIONAL', sms: state } });
          const source = printNodeArray(rendered);
          assert.match(source, new RegExp(`multifactor:\\s+\\{[\\s\\S]*sms:\\s${state}`));
        });
      }
    });
    const modes: UserPoolMfaConfig[] = ['REQUIRED', 'OFF', 'OPTIONAL'];
    for (const mode of modes) {
      it(`correctly renders mfa state of ${mode}`, async () => {
        const rendered = renderAuthNode({ mfa: { mode } });
        const source = printNodeArray(rendered);
        assert.match(source, new RegExp(`multifactor:\\s+\\{\\s+mode:\\s"${mode}"`));
      });
    }
  });
  describe('imports', () => {
    it('imports @aws-amplify/backend', async () => {
      const rendered = renderAuthNode({
        loginOptions: { email: true },
      });
      const source = printNodeArray(rendered);
      assert.match(source, /import\s?\{\s?defineAuth\s?\}\s?from\s?"\@aws-amplify\/backend"/);
    });
  });
  describe('username attributes', () => {
    describe('Standard Attributes', () => {
      const attributes: Array<keyof StandardAttributes> = [
        'email',
        'gender',
        'locale',
        'address',
        'website',
        'fullname',
        'nickname',
        'timezone',
        'birthdate',
        'givenName',
        'familyName',
        'middleName',
        'phoneNumber',
        'profilePage',
        'profilePicture',
        'lastUpdateTime',
        'preferredUsername',
      ];
      for (const attribute of attributes) {
        for (const truthiness of [true, false]) {
          it(`renders ${attribute}: ${truthiness} individually`, () => {
            const authDefinition: AuthDefinition = {
              loginOptions: {
                email: true,
              },
              standardUserAttributes: {
                [attribute as Attribute]: {
                  mutable: truthiness,
                  required: truthiness,
                },
              },
            };
            const node = renderAuthNode(authDefinition);
            const source = printNodeArray(node);
            assert(source.includes(attribute));
            assert(source.includes(`mutable: ${truthiness}`));
            assert(source.includes(`required: ${truthiness}`));
          });
        }
      }
    });
    describe('Custom Attributes', () => {
      it('renders custom attributes', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            email: true,
          },
          customUserAttributes: { 'custom:Test1': { dataType: 'Number', mutable: true, min: 10, max: 100 } },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert(source.includes('custom:Test1'));
        assert(source.includes('dataType: "Number"'));
      });
      it('does not render anything if CustomAttribute is undefined', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            email: true,
          },
          customUserAttributes: { 'custom:isAllowed': undefined },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert(!source.includes('custom:isAllowed'));
      });
    });
  });
  describe('groups', () => {
    it('renders groups', () => {
      const authDefinition: AuthDefinition = {
        loginOptions: {},
        groups: ['manager'],
      };
      const node = renderAuthNode(authDefinition);
      const source = printNodeArray(node);
      assert.match(source, /defineAuth\(\{[\s\S]*groups:\s\["manager"\]/);
    });
  });
  describe('loginWith', () => {
    describe('email', () => {
      type TestCase<T extends keyof EmailOptions = keyof EmailOptions> = {
        optionProperty: T;
        gen2DefinitionProperty: string;
        value: EmailOptions[T];
        searchPattern: string;
      };

      const emailPropertyTestCases: TestCase[] = [
        {
          optionProperty: 'emailVerificationSubject',
          value: 'My Verification Subject',
          gen2DefinitionProperty: 'verificationEmailSubject',
          searchPattern: '"My Verification Subject"',
        },
        {
          optionProperty: 'emailVerificationBody',
          gen2DefinitionProperty: 'verificationEmailBody',
          value: 'My Verification Body',
          searchPattern: '\\(\\) => "My Verification Body"',
        },
      ];
      for (const { optionProperty: property, value, searchPattern, gen2DefinitionProperty } of emailPropertyTestCases) {
        it(`renders email login parameter ${property}`, () => {
          const emailOptions: Partial<EmailOptions> = {
            [property as keyof EmailOptions]: value,
          };
          const authDefinition: AuthDefinition = {
            loginOptions: {
              emailOptions,
            },
          };
          const node = renderAuthNode(authDefinition);
          const source = printNodeArray(node);
          assert.match(
            source,
            new RegExp(
              `defineAuth\\(\\{\\s+loginWith:\\s+\\{\\s+email:\\s+\\{\\s+${gen2DefinitionProperty}: ${searchPattern}\\s+\\}\\s+\\}\\s+\\}\\)`,
            ),
          );
        });
      }
      it('renders `email: true`', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            email: true,
          },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert.match(source, /defineAuth\(\{\s+loginWith:\s+\{\s+email:\s?true\s+\}\s+\}\)/);
      });
    });
    describe('phone', () => {
      it('renders phone options', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            phone: {
              verificationMessage: 'My Verification Message',
            },
          },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert.match(source, /phone:\s*{\s*verificationMessage:\s*\(\)\s*=>\s*"My Verification Message"\s*}/);
      });

      it('renders `phone: true`', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            phone: true,
          },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert.match(source, /defineAuth\(\{\s+loginWith:\s+\{\s+phone:\s?true\s+\}\s+\}\)/);
      });
    });
    describe('OAuth scopes', () => {
      it('renders oauth scopes', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {
            googleLogin: true,
            scopes: ['EMAIL', 'OPENID'],
          },
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert.match(source, /defineAuth\(\{[\s\S]*scopes:\s\["EMAIL",\s"OPENID"\]/);
      });
      it('renders no oauth scopes if not passed', () => {
        const authDefinition: AuthDefinition = {
          loginOptions: {},
        };
        const node = renderAuthNode(authDefinition);
        const source = printNodeArray(node);
        assert.doesNotMatch(source, /scopes:/);
      });
    });
    it('renders attributeMapping if passed along with Google login', () => {
      const authDefinition: AuthDefinition = {
        loginOptions: {
          googleLogin: true,
          googleAttributes: { fullname: 'name' } as AttributeMappingRule,
        },
      };
      const node = renderAuthNode(authDefinition);
      const source = printNodeArray(node);
      assert.match(source, /defineAuth\(\{[\s\S]*attributeMapping:\s\{[\s\S]*fullname:\s"name"/);
    });
  });
});
