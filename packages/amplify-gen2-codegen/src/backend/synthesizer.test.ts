import assert from 'node:assert';
import { BackendSynthesizer } from './synthesizer';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { getImportRegex } from '../test_utils/import_regex';
import { PolicyOverrides } from '../auth/source_builder';

describe('BackendRenderer', () => {
  describe('overrides', () => {
    describe('user pool', () => {
      describe('no overrides present', () => {
        it('does not render cfnUserPool accessor', () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({
            auth: {
              importFrom: './auth/resource.ts',
            },
          });
          const output = printNodeArray(rendered);
          assert(!output.includes('cfnUserPool'));
        });
      });
      const testCases: PolicyOverrides = {
        'Policies.PasswordPolicy.MinimumLength': 32,
        'Policies.PasswordPolicy.RequireNumbers': true,
        'Policies.PasswordPolicy.RequireSymbols': false,
        'Policies.PasswordPolicy.RequireLowercase': true,
        'Policies.PasswordPolicy.RequireUppercase': false,
        'Policies.PasswordPolicy.TemporaryPasswordValidityDays': 10,
        userPoolName: 'Test_Name-dev',
        userNameAttributes: undefined,
      };
      const mappedPolicyType: Record<string, string> = {
        MinimumLength: 'minimumLength',
        RequireUppercase: 'requireUppercase',
        RequireLowercase: 'requireLowercase',
        RequireNumbers: 'requireNumbers',
        RequireSymbols: 'requireSymbols',
        PasswordHistorySize: 'passwordHistorySize',
        TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
      };
      for (const [key, value] of Object.entries(testCases)) {
        it(`renders override for ${key}`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({
            auth: {
              importFrom: './auth/resource.ts',
              userPoolOverrides: {
                [key]: value,
              },
            },
          });
          const output = printNodeArray(rendered);
          if (key.includes('userPoolName')) {
            assert(value);
            assert(typeof value === 'string');
            assert(output.includes('cfnUserPool.userPoolName = `Test_Name-${AMPLIFY_GEN_1_ENV_NAME}`'));
          } else if (key.includes('PasswordPolicy')) {
            const policyKey = key.split('.')[2];
            if (value !== undefined && policyKey in mappedPolicyType) {
              if (typeof value === 'string') assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:"${value}"}}`));
            } else if (typeof value === 'number') {
              assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:${value}}}`));
            } else if (typeof value === 'boolean') {
              assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:${value}}}`));
            }
          } else if (value === undefined) {
            assert(output.includes(`cfnUserPool.${key} = ${value}`));
          } else {
            assert(output.includes(`cfnUserPool.${key} = "${value}"`));
          }
        });
      }
      it('renders multiple overrides', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: {
            importFrom: './auth/resource.ts',
            userPoolOverrides: testCases,
          },
        });
        const output = printNodeArray(rendered);
        for (const [key, value] of Object.entries(testCases)) {
          if (key.includes('userPoolName')) {
            assert(value);
            assert(typeof value === 'string');
            assert(output.includes('cfnUserPool.userPoolName = `Test_Name-${AMPLIFY_GEN_1_ENV_NAME}`'));
          } else if (key.includes('PasswordPolicy')) {
            const policyKey = key.split('.')[2];
            if (value !== undefined && policyKey in mappedPolicyType) {
              if (typeof value === 'string') assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:"${value}"}}`));
            } else if (typeof value === 'number') {
              assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:${value}}}`));
            } else if (typeof value === 'boolean') {
              assert(output.includes(`cfnUserPool.policies = {passwordPolicy:{${policyKey}:${value}}}`));
            }
          } else if (value) {
            assert(output.includes(`cfnUserPool.${key} = "${value}"`));
          }
        }
      });
    });
  });
  describe('guestLogin', () => {
    it('Renders cfnIdentityPool accessor if guestLogin is false', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          guestLogin: false,
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('cfnIdentityPool'));
    });
    it('Does not render cfnIdentityPool accessor if guestLogin is true', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          guestLogin: true,
        },
      });
      const output = printNodeArray(rendered);
      assert(!output.includes('cfnIdentityPool'));
    });
  });
  describe('Identity Pool Name', () => {
    it('Renders cfnIdentityPool accessor if identityPoolName is defined', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          identityPoolName: 'Test_Name_dev',
          guestLogin: true,
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('cfnIdentityPool.identityPoolName = `Test_Name_${AMPLIFY_GEN_1_ENV_NAME}`'));
    });
    it('Does not render cfnIdentityPool accessor if identityPoolName is undefined and guestLogin is true', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          guestLogin: true,
        },
      });
      const output = printNodeArray(rendered);
      assert(!output.includes('cfnIdentityPool'));
    });
  });
  describe('OAuth Flows', () => {
    it('Renders cfnUserPoolClient accessor if oAuthFlows is defined', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          oAuthFlows: ['code'],
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('cfnUserPoolClient'));
    });
    it('Does not render cfnUserPoolClient accessor if oAuthFlows is undefined', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
        },
      });
      const output = printNodeArray(rendered);
      assert(!output.includes('cfnUserPoolClient'));
    });
  });
  describe('errors for unsupported categories', () => {
    it('Renders error statement if unsupported categories are present', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        unsupportedCategories: new Map([
          ['rest api', 'https://docs.amplify.aws/react/build-a-backend/add-aws-services/rest-api/'],
          ['geo', 'https://docs.amplify.aws/react/build-a-backend/add-aws-services/geo/'],
          ['predictions', 'https://docs.amplify.aws/react/build-a-backend/add-aws-services/predictions/'],
        ]),
      });
      const output = printNodeArray(rendered);
      assert(
        output.includes(
          'throw new Error("Category rest api is unsupported, please follow https://docs.amplify.aws/react/build-a-backend/add-aws-services/rest-api/")',
        ),
      );
      assert(
        output.includes(
          'throw new Error("Category geo is unsupported, please follow https://docs.amplify.aws/react/build-a-backend/add-aws-services/geo/")',
        ),
      );
      assert(
        output.includes(
          'throw new Error("Category predictions is unsupported, please follow https://docs.amplify.aws/react/build-a-backend/add-aws-services/predictions/")',
        ),
      );
    });
  });
  describe('imports', () => {
    for (const resource of ['storage', 'data', 'auth']) {
      describe(resource, () => {
        const importFrom = './my-test/path';
        const importRegex = new RegExp(`import \\{ ${resource} \\} from "${importFrom}"`);
        it(`does not import ${resource} if no ${resource} key is passed`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({});
          const source = printNodeArray(rendered);
          assert.doesNotMatch(source, importRegex);
        });
        it(`imports ${resource}`, () => {
          const renderer = new BackendSynthesizer();
          const rendered = renderer.render({ [resource]: { importFrom, hasS3Bucket: 'bucket_name', bucketName: 'testBucket' } });
          const source = printNodeArray(rendered);
          assert.match(source, importRegex);
        });
      });
    }
  });
  describe('defineBackend invocation', () => {
    describe('storage', () => {
      it('does not define storage property if it is undefined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        assert(!output.includes('storage: storage'));
      });
      it('adds property assignment when defined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          storage: {
            importFrom: 'my-storage',
            hasS3Bucket: 'bucket_name',
            bucketName: 'testBucket',
          },
        });
        const output = printNodeArray(rendered);
        assert(output.includes('storage'));
      });
    });
    describe('auth', () => {
      it('does not define auth property if it is undefined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        assert(!output.includes('storage'));
      });
      it('adds property assignment when defined', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: {
            importFrom: 'my-auth',
          },
        });
        const output = printNodeArray(rendered);
        assert(output.includes('auth'));
      });
    });
  });
  describe('imports', () => {
    describe('defineBackend', () => {
      it('imports defineBackend from "@aws-amplify/backend"', () => {
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({});
        const output = printNodeArray(rendered);
        const regex = getImportRegex('defineBackend', '@aws-amplify/backend');
        assert.match(output, regex);
      });
    });
    describe('storage', () => {
      it('imports storage from the specified import path', () => {
        const storageImportLocation = 'storage/resource.ts';
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          storage: {
            importFrom: storageImportLocation,
            hasS3Bucket: 'bucket_name',
            bucketName: 'testBucket',
          },
        });
        const output = printNodeArray(rendered);
        const regex = getImportRegex('storage', storageImportLocation);
        assert.match(output, regex);
      });
    });
    describe('auth', () => {
      it('imports auth from the specified import path', () => {
        const authImportLocation = 'auth/resource.ts';
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          auth: { importFrom: authImportLocation },
        });
        const output = printNodeArray(rendered);
        const regex = getImportRegex('auth', authImportLocation);
        assert.match(output, regex);
      });
    });
    describe('data', () => {
      it('imports data from the specified import path', () => {
        const dataImportLocation = 'data/resource.ts';
        const renderer = new BackendSynthesizer();
        const rendered = renderer.render({
          data: { importFrom: dataImportLocation },
        });
        const output = printNodeArray(rendered);
        const regex = getImportRegex('data', dataImportLocation);
        assert.match(output, regex);
        expect(output).not.toContain('// Tags.of(backend.stack).add("gen1-migrated-app", "true")');
      });
    });
  });
  describe('renders storage overrides', () => {
    it('renders s3 bucket name', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        storage: {
          importFrom: 'my-storage',
          bucketName: 'testBucket',
          hasS3Bucket: 'bucket-name',
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('bucketName'));
    });
    it('renders s3 bucket encryption algorithm', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        storage: {
          importFrom: 'my-storage',
          bucketName: 'testBucket',
          hasS3Bucket: 'bucket-name',
          bucketEncryptionAlgorithm: {
            serverSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
              KMSMasterKeyID: 'key-id',
            },
            bucketKeyEnabled: true,
          },
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('bucketEncryption'));
      assert(output.includes('sseAlgorithm'));
    });
  });
  describe('UserPoolClient Configuration using render()', () => {
    it('renders complete user pool client configuration', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          userPoolClient: {
            UserPoolId: 'us-west-2_aaaaaaaaa',
            ClientName: 'MyApp',
            ClientId: '38fjsnc484p94kpqsnet7mpld0',
            ClientSecret: 'CLIENT_SECRET',
            RefreshTokenValidity: 30,
            AccessTokenValidity: 79,
            ReadAttributes: [
              'address',
              'birthdate',
              'custom:CustomAttr1',
              'custom:CustomAttr2',
              'email',
              'email_verified',
              'family_name',
              'gender',
              'given_name',
              'locale',
              'middle_name',
              'name',
              'nickname',
              'phone_number',
              'phone_number_verified',
              'picture',
              'preferred_username',
              'profile',
              'updated_at',
              'website',
              'zoneinfo',
            ],
            WriteAttributes: [
              'address',
              'birthdate',
              'custom:CustomAttr1',
              'custom:CustomAttr2',
              'email',
              'family_name',
              'gender',
              'given_name',
              'locale',
              'middle_name',
              'name',
              'nickname',
              'phone_number',
              'picture',
              'preferred_username',
              'profile',
              'updated_at',
              'website',
              'zoneinfo',
            ],
            ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH', 'USER_PASSWORD_AUTH'],
            AllowedOAuthFlowsUserPoolClient: true,
            AllowedOAuthFlows: ['code', 'implicit'],
            AllowedOAuthScopes: [
              'phone',
              'email',
              'openid',
              'profile',
              'aws.cognito.signin.user.admin',
              'custom:CustomScope1',
              'custom:CustomScope2',
            ],
            CallbackURLs: ['XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXXXXXX'],
            LogoutURLs: ['XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXXXXXX'],
            DefaultRedirectURI: 'XXXXXXXXXXXXXXXXXX',
            SupportedIdentityProviders: ['COGNITO', 'Facebook', 'LoginWithAmazon'],
            AuthSessionValidity: 3,
            EnableTokenRevocation: true,
            EnablePropagateAdditionalUserContextData: true,
            TokenValidityUnits: {
              RefreshToken: 'hours',
              AccessToken: 'minutes',
              IdToken: 'minutes',
            },
          },
        },
      });

      const output = printNodeArray(rendered);

      // Basic configuration
      expect(output).toContain('NativeAppClient');
      expect(output).toContain('userPoolClientName: "MyApp"');

      // Token validity settings
      expect(output).toContain('refreshTokenValidity: Duration.hours(30),');
      expect(output).toContain('accessTokenValidity: Duration.minutes(79)');

      // Attributes
      expect(output).toContain('readAttributes: new ClientAttributes().withStandardAttributes');
      expect(output).toContain('writeAttributes: new ClientAttributes().withStandardAttributes');
      expect(output).toContain('custom:CustomAttr1');

      // OAuth configuration
      expect(output).toContain('flows: { authorizationCodeGrant: true, implicitCodeGrant: true, clientCredentials: false }');

      // OAuth scopes
      expect(output).toContain('OAuthScope.PHONE');
      expect(output).toContain('OAuthScope.EMAIL');
      expect(output).toContain('OAuthScope.OPENID');

      // URLs
      expect(output).toContain('callbackUrls');
      expect(output).toContain('logoutUrls');
      expect(output).toContain('defaultRedirectUri');

      // Auth flows
      expect(output).toContain('authFlows: { adminUserPassword: false, custom: false, userPassword: false, userSrp: false }');

      // Additional settings
      expect(output).toContain(`supportedIdentityProviders`);
      expect(output).toContain(`UserPoolClientIdentityProvider.COGNITO`);
      expect(output).toContain(`UserPoolClientIdentityProvider.FACEBOOK`);
      expect(output).toContain(`UserPoolClientIdentityProvider.AMAZON`);
      expect(output).toContain('authSessionValidity: Duration.minutes(3)');
      expect(output).toContain('enableTokenRevocation: true');
      expect(output).toContain('enablePropagateAdditionalUserContextData: true');
      expect(output).toContain('generateSecret: true');

      expect(output).toContain(
        'const providerSetupResult = (backend.auth.stack.node.children.find(child => child.node.id === "amplifyAuth") as any).providerSetupResult;',
      );
      expect(output).toContain('Object.keys(providerSetupResult).forEach(provider => {');
      expect(output).toContain('userPoolClient.node.addDependency(providerSetupPropertyValue)');
      expect(output).toContain('// backend.auth.resources.userPool.node.tryRemoveChild("UserPoolDomain");');
    });
    it('renders user pool client configuration with default value for generateSecrets', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
          userPoolClient: {
            UserPoolId: 'us-west-2_aaaaaaaaa',
            ClientName: 'MyApp',
            ClientId: '38fjsnc484p94kpqsnet7mpld0',
          },
        },
      });

      const output = printNodeArray(rendered);

      // Basic configuration
      expect(output).toContain('NativeAppClient');
      expect(output).toContain('userPoolClientName: "MyApp"');

      // Additional settings
      expect(output).toContain(`generateSecret: false\n});`);
    });
  });
  describe('environment variables', () => {
    it('renders dynamic environment variables', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        auth: {
          importFrom: './auth/resource.ts',
        },
      });
      const output = printNodeArray(rendered);
      assert(output.includes('process.env.AMPLIFY_GEN_1_ENV_NAME'));
      assert(output.includes('ci.isCI && !AMPLIFY_GEN_1_ENV_NAME'));
      assert(output.includes('throw new Error("AMPLIFY_GEN_1_ENV_NAME is required in CI environment")'));
      assert(output.includes('AMPLIFY_GEN_1_ENV_NAME = "sandbox"'));
    });
  });
  describe('Custom resources are rendered()', () => {
    it('renders custom resources', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({
        customResources: ['resource1', 'resource2'],
      });

      const output = printNodeArray(rendered);

      const normalizedOutput = output.replace(/\s+/g, ' ').trim();

      expect(normalizedOutput).toContain(
        `new resource1(backend.stack, "resource1", undefined, { category: "custom", resourceName: "resource1" });`,
      );
      expect(normalizedOutput).toContain(
        `new resource2(backend.stack, "resource2", undefined, { category: "custom", resourceName: "resource2" });`,
      );
    });

    it('does not render custom resources when none are provided', () => {
      const renderer = new BackendSynthesizer();
      const rendered = renderer.render({});

      const output = printNodeArray(rendered);

      expect(output).not.toContain('new resource1');
      expect(output).not.toContain('category: "custom"');
    });
  });
});
