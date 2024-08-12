import { StandardAttributes } from 'aws-cdk-lib/aws-cognito';
import assert from 'node:assert';
import { Attribute, AuthDefinition, AuthTriggerEvents, EmailOptions, renderAuthNode, UserPoolMfaConfig } from './source_builder';
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
        console.log(source);
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
  });
  describe('lambda', () => {
    it('imports defineFunction when a lambda trigger is defined', () => {
      const rendered = renderAuthNode({ lambdaTriggers: { preSignUp: { source: "console.log('hello, world!')" } } });
      const source = printNodeArray(rendered);
      assert.match(source, /import\s?\{\s?defineAuth, defineFunction\s?\}\s?from\s?"\@aws-amplify\/backend"/);
    });
    it('adds a triggers object when a lambda trigger is defined', () => {
      const rendered = renderAuthNode({ lambdaTriggers: { preSignUp: { source: "console.log('hello, world!')" } } });
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
      const rendered = renderAuthNode({ lambdaTriggers: { [testCase]: { source: "console.log('hello, world!')" } } });
      const source = printNodeArray(rendered);
      assert.match(source, new RegExp(`triggers: \\{\\s+\\/\\*[\\S\\s]*?\\*\\/\\s+${testCase}: defineFunction\\(\\{`));
    }
  });
  describe('mfa', () => {
    it('does not render the multifactor property if no multifactor options are specified', () => {
      const rendered = renderAuthNode({});
      const source = printNodeArray(rendered);
      assert.doesNotMatch(source, new RegExp(`multifactor:`));
    });
    describe('totp', () => {
      it('renders false if totp is not specified', () => {
        const rendered = renderAuthNode({ mfa: { mode: 'OPTIONAL' } });
        const source = printNodeArray(rendered);
        assert.match(source, new RegExp(`multifactor:\\s+\\{[\\s\\S]*totp:\\sfalse`));
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
    const modes: UserPoolMfaConfig[] = ['ON', 'OFF', 'OPTIONAL'];
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
            userAttributes: {
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
  });
});
