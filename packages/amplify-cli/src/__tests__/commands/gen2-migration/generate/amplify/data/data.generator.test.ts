import { GraphqlApi } from '@aws-sdk/client-appsync';
import { DataGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App, DiscoveredResource } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

const dataResource: DiscoveredResource = {
  category: 'api',
  resourceName: 'testApi',
  service: 'AppSync',
  key: 'api:AppSync',
};

function createMockGen1App(overrides?: Record<string, unknown>): Gen1App {
  return {
    envName: 'main',
    ccbDir: '/tmp/ccb',
    meta: jest.fn(),
    metaOutput: jest.fn(),
    singleResourceName: jest.fn().mockReturnValue('testApi'),
    file: jest.fn(),
    resourceMetaOutput: jest.fn(),
    categoryMeta: jest.fn(),
    aws: {
      fetchGraphqlApi: jest.fn(),
    },
    ...overrides,
  } as unknown as Gen1App;
}
/** Sets up Gen1App mocks for a successful data plan(). */
function setupDataMocks(
  gen1App: Gen1App,
  opts: {
    schema: string;
    apiId?: string;
    authorizationModes?: unknown;
    graphqlApi?: GraphqlApi;
    hasAuth?: boolean;
  },
): void {
  const apiId = opts.apiId ?? 'api-123';
  (gen1App.file as jest.Mock).mockReturnValue(opts.schema);
  (gen1App.resourceMetaOutput as jest.Mock).mockImplementation((_resource: DiscoveredResource, key: string) => {
    if (key === 'GraphQLAPIIdOutput') return apiId;
    if (key === 'authConfig') return opts.authorizationModes;
    return undefined;
  });
  (gen1App.categoryMeta as jest.Mock).mockImplementation((category: string) => {
    if (category === 'auth') return opts.hasAuth ? { myAuth: {} } : undefined;
    return undefined;
  });
  (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue(
    opts.graphqlApi ?? { apiId, name: 'testApi', additionalAuthenticationProviders: [] },
  );
}

describe('DataGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  describe('error handling', () => {
    it('throws when AppSync API has no GraphQLAPIIdOutput', async () => {
      const gen1App = createMockGen1App();
      (gen1App.file as jest.Mock).mockReturnValue('type Todo @model { id: ID! }');
      (gen1App.resourceMetaOutput as jest.Mock).mockImplementation(() => {
        throw new Error('no GraphQLAPIIdOutput');
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      await expect(generator.plan()).rejects.toThrow('no GraphQLAPIIdOutput');
    });

    it('throws when AppSync API is not found via SDK', async () => {
      const gen1App = createMockGen1App();
      (gen1App.file as jest.Mock).mockReturnValue('type Todo @model { id: ID! }');
      (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue('api-123');
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue(undefined);

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      await expect(generator.plan()).rejects.toThrow("AppSync API 'api-123' not found");
    });
  });

  describe('orchestration', () => {
    it('returns one operation describing data/resource.ts', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, { schema: 'type Todo @model { id: ID! }' });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('data/resource.ts');
    });

    it('registers namespace import and defineBackend entry on backendGenerator', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, { schema: 'type Todo @model { id: ID! }' });

      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('data', './data/resource');
      expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('data', 'data', 'data');
    });

    it('contributes applyEscapeHatches call when auth exists and additional providers present', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        hasAuth: true,
        graphqlApi: {
          apiId: 'api-123',
          name: 'testApi',
          additionalAuthenticationProviders: [
            { authenticationType: 'AMAZON_COGNITO_USER_POOLS', userPoolConfig: { userPoolId: 'pool-1' } },
          ],
        } as GraphqlApi,
      });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).toHaveBeenCalledWith(expect.objectContaining({ alias: 'data' }));
    });

    it('contributes applyEscapeHatches call when additional providers present even without auth category', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        hasAuth: false,
        graphqlApi: {
          apiId: 'api-123',
          name: 'testApi',
          additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS' }],
        } as GraphqlApi,
      });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).toHaveBeenCalledWith(expect.objectContaining({ alias: 'data' }));
    });

    it('does not contribute applyEscapeHatches call when additional providers list is empty', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, { schema: 'type Todo @model { id: ID! }', hasAuth: true });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).not.toHaveBeenCalled();
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic defineData resource with schema and table mappings', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! title: String! }',
        apiId: 'abc123',
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! title: String! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-abc123-main' },
            },
          ],
          schema,
        });
        "
      `);
    });

    it('renders authorization modes with default auth type', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        apiId: 'abc',
        authorizationModes: {
          defaultAuthentication: { authenticationType: 'AMAZON_COGNITO_USER_POOLS' },
        },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-abc-main' },
            },
          ],
          authorizationModes: {
            defaultAuthorizationMode: 'userPool',
          },
          schema,
        });
        "
      `);
    });

    it('renders API key auth mode with expiration and description', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
            apiKeyConfig: { apiKeyExpirationDays: 30, description: 'My API Key' },
          },
        },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-api-123-main' },
            },
          ],
          authorizationModes: {
            defaultAuthorizationMode: 'apiKey',
            apiKeyAuthorizationMode: { expiresInDays: 30, description: 'My API Key' },
          },
          schema,
        });
        "
      `);
    });

    it('renders OIDC auth mode', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        authorizationModes: {
          additionalAuthenticationProviders: [
            {
              authenticationType: 'OPENID_CONNECT',
              openIDConnectConfig: {
                name: 'MyOIDC',
                issuerUrl: 'https://example.com',
                clientId: 'client123',
                authTTL: 3600,
                iatTTL: 7200,
              },
            },
          ],
        },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-api-123-main' },
            },
          ],
          authorizationModes: {
            oidcAuthorizationMode: {
              oidcProviderName: 'MyOIDC',
              oidcIssuerUrl: 'https://example.com',
              clientId: 'client123',
              tokenExpiryFromAuthInSeconds: 3600,
              tokenExpireFromIssueInSeconds: 7200,
            },
          },
          schema,
        });
        "
      `);
    });

    it('renders Lambda auth mode', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        authorizationModes: {
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_LAMBDA',
              lambdaAuthorizerConfig: { lambdaFunction: 'myAuthFn', ttlSeconds: 300 },
            },
          ],
        },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-api-123-main' },
            },
          ],
          authorizationModes: {
            lambdaAuthorizationMode: { function: myAuthFn, timeToLiveInSeconds: 300 },
          },
          schema,
        });
        "
      `);
    });

    it('renders logging config', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! }',
        graphqlApi: {
          logConfig: { fieldLogLevel: 'ERROR', excludeVerboseContent: true },
          additionalAuthenticationProviders: [],
        } as unknown as GraphqlApi,
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-api-123-main' },
            },
          ],
          logging: { fieldLogLevel: 'error', excludeVerboseContent: true },
          schema,
        });
        "
      `);
    });

    it('replaces ${env} with ${branchName} in schema and adds branchName declaration', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { env: String @default(value: "${env}") }',
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      const output = writtenFile('resource.ts');
      expect(output).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';
        const schema = \`type Todo @model { env: String @default(value: "\${branchName}") }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: { Todo: 'Todo-api-123-main' },
            },
          ],
          schema,
        });
        "
      `);
      expect(output).not.toContain('${env}');
    });

    it('does not emit branchName when schema has no ${env}', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, { schema: 'type Todo @model { id: ID! }' });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).not.toContain('const branchName');
    });

    it('renders multiple table mappings', async () => {
      const gen1App = createMockGen1App();
      setupDataMocks(gen1App, {
        schema: 'type Todo @model { id: ID! } type Post @model { id: ID! }',
        apiId: 'abc',
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource);
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineData } from '@aws-amplify/backend';
        import type { Backend } from '../backend';

        const schema = \`type Todo @model { id: ID! } type Post @model { id: ID! }\`;

        export const data = defineData({
          migratedAmplifyGen1DynamoDbTableMappings: [
            {
              //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
              branchName: 'main',
              modelNameToTableNameMapping: {
                Todo: 'Todo-abc-main',
                Post: 'Post-abc-main',
              },
            },
          ],
          schema,
        });
        "
      `);
    });
  });
});
