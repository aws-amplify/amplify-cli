import { GraphqlApi } from '@aws-sdk/client-appsync';
import {
  DataGenerator,
  parseVtlFilename,
  classifyVtlFiles,
  ParsedExtended,
} from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { DiscoveredResource, Gen1App } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

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

/**
 * Mocks gen1App.file() to return the appropriate schema content
 * based on the requested path. Throws on unexpected paths.
 */
function mockSchema(gen1App: Gen1App, rawSchema: string, modelNames: string[]): void {
  const buildSchema = modelNames.map((m) => `type Model${m}Connection { items: [${m}]! nextToken: String }`).join('\n');
  jest.spyOn(gen1App, 'fileExists').mockImplementation((p: string) => p.endsWith('schema.graphql'));
  jest.spyOn(gen1App, 'file').mockImplementation((p: string) => {
    if (p.includes('build/schema.graphql')) return buildSchema;
    if (p.endsWith('schema.graphql')) return rawSchema;
    throw new Error(`Unexpected file() call with path: ${p}`);
  });
}

describe('DataGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('throws when AppSync API has no GraphQLAPIIdOutput', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: {
            /* no GraphQLAPIIdOutput */
          },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    await expect(generator.plan()).rejects.toThrow('GraphQLAPIIdOutput');
  });

  it('throws when AppSync API is not found via SDK', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue(undefined);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    await expect(generator.plan()).rejects.toThrow("AppSync API 'api-123' not found");
  });

  it('returns one operation describing data/resource.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('data/resource.ts');
  });

  it('registers namespace import and defineBackend entry on backendGenerator', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('data', './data/resource');
    expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('data', 'data', 'data');
  });

  it('contributes applyEscapeHatches call when auth exists and additional providers present', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
      auth: { myAuth: { service: 'Cognito' } },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS', userPoolConfig: { userPoolId: 'pool-1' } }],
    } as GraphqlApi);

    const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addApplyEscapeHatchesCallSpy).toHaveBeenCalledWith(expect.objectContaining({ alias: 'data' }));
  });

  it('contributes applyEscapeHatches call when additional providers present even without auth category', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS' }],
    } as GraphqlApi);

    const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addApplyEscapeHatchesCallSpy).toHaveBeenCalledWith(expect.objectContaining({ alias: 'data' }));
  });

  it('does not contribute applyEscapeHatches call when additional providers list is empty', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
      auth: { myAuth: { service: 'Cognito' } },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addApplyEscapeHatchesCallSpy).not.toHaveBeenCalled();
  });

  it('renders a basic defineData resource with schema and table mappings', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'abc123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! title: String! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'abc123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'abc123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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

  it('renders AWS_IAM as default authorization mode', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'abc';
      if (key === 'authConfig') return { defaultAuthentication: { authenticationType: 'AWS_IAM' } } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({ apiId: 'abc', name: 'testApi', additionalAuthenticationProviders: [] });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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
          defaultAuthorizationMode: 'iam',
        },
        schema,
      });
      "
    `);
  });

  it('renders API key auth mode with expiration and description', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      if (key === 'authConfig')
        return {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
            apiKeyConfig: { apiKeyExpirationDays: 30, description: 'My API Key' },
          },
        } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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

  it('renders OIDC auth mode with TTL converted from milliseconds to seconds', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      if (key === 'authConfig')
        return {
          additionalAuthenticationProviders: [
            {
              authenticationType: 'OPENID_CONNECT',
              openIDConnectConfig: {
                name: 'MyOIDC',
                issuerUrl: 'https://example.com',
                clientId: 'client123',
                authTTL: 3600000,
                iatTTL: 7200000,
              },
            },
          ],
        } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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

  it('renders OIDC auth mode without clientId when absent and supplements from live API', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      if (key === 'authConfig')
        return {
          defaultAuthentication: {
            authenticationType: 'OPENID_CONNECT',
            openIDConnectConfig: {
              name: 'NoClientIdProvider',
              issuerUrl: 'https://idp.example.com',
              authTTL: 1800000,
              iatTTL: 3600000,
            },
          },
        } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      openIDConnectConfig: { issuer: 'https://idp.example.com', clientId: 'supplemented-client-id' },
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toContain("clientId: 'supplemented-client-id'");
    expect(output).toContain('tokenExpiryFromAuthInSeconds: 1800');
    expect(output).toContain('tokenExpireFromIssueInSeconds: 3600');
  });

  it('floors TTL values when not exact multiples of 1000', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      if (key === 'authConfig')
        return {
          defaultAuthentication: {
            authenticationType: 'OPENID_CONNECT',
            openIDConnectConfig: {
              name: 'Floored',
              issuerUrl: 'https://idp.example.com',
              clientId: 'abc',
              authTTL: 3599999,
              iatTTL: 7200500,
            },
          },
        } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toContain('tokenExpiryFromAuthInSeconds: 3599');
    expect(output).toContain('tokenExpireFromIssueInSeconds: 7200');
  });

  it('renders Lambda auth mode', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      if (key === 'authConfig')
        return {
          additionalAuthenticationProviders: [
            {
              authenticationType: 'AWS_LAMBDA',
              lambdaAuthorizerConfig: { lambdaFunction: 'myAuthFn', ttlSeconds: 300 },
            },
          ],
        } as any;
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      logConfig: { fieldLogLevel: 'ERROR', excludeVerboseContent: true },
      additionalAuthenticationProviders: [],
    } as unknown as GraphqlApi);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { env: String @default(value: "${env}") }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'api-123' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! }', ['Todo']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({
      apiId: 'api-123',
      name: 'testApi',
      additionalAuthenticationProviders: [],
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).not.toContain('const branchName');
  });

  it('renders multiple table mappings', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'abc' },
        },
      },
    });
    mockSchema(gen1App, 'type Todo @model { id: ID! } type Post @model { id: ID! }', ['Todo', 'Post']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'abc';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({ apiId: 'abc', name: 'testApi', additionalAuthenticationProviders: [] });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
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

  it('renders table mappings when @model is not the first directive', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        testApi: {
          service: 'AppSync',
          output: { GraphQLAPIIdOutput: 'abc' },
        },
      },
    });
    const rawSchema = 'type Todo @auth(rules: [{ allow: public }]) @model { id: ID! } type Post @key(name: "byUser") @model { id: ID! }';
    mockSchema(gen1App, rawSchema, ['Todo', 'Post']);
    jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation((_resource: DiscoveredResource, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'abc';
      return undefined as any;
    });
    jest.spyOn(gen1App.aws, 'fetchGraphqlApi').mockResolvedValue({ apiId: 'abc', name: 'testApi', additionalAuthenticationProviders: [] });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, dataResource, logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';
      import type { Backend } from '../backend';

      const schema = \`type Todo @auth(rules: [{ allow: public }]) @model { id: ID! } type Post @key(name: "byUser") @model { id: ID! }\`;

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

describe('parseVtlFilename', () => {
  it('returns ParsedOverride with correct fields for a 4-segment filename', () => {
    const result = parseVtlFilename('Mutation.createTodo.req.vtl');
    expect(result).toEqual({
      kind: 'override',
      typeName: 'Mutation',
      fieldName: 'createTodo',
      templateType: 'req',
      filename: 'Mutation.createTodo.req.vtl',
    });
  });

  it('returns ParsedExtended with correct fields for a 6-segment filename', () => {
    const result = parseVtlFilename('Mutation.createBoard.init.2.req.vtl');
    expect(result).toEqual({
      kind: 'extended',
      typeName: 'Mutation',
      fieldName: 'createBoard',
      slot: 'init',
      order: 2,
      templateType: 'req',
      filename: 'Mutation.createBoard.init.2.req.vtl',
    });
  });

  it('returns undefined for a 3-segment filename', () => {
    expect(parseVtlFilename('Mutation.req.vtl')).toBeUndefined();
  });

  it('returns undefined for a 5-segment filename', () => {
    expect(parseVtlFilename('Mutation.createTodo.init.req.vtl')).toBeUndefined();
  });

  it('returns undefined for a 7-segment filename', () => {
    expect(parseVtlFilename('Mutation.createTodo.init.2.req.vtl.extra')).toBeUndefined();
  });

  it('correctly parses the order field as a number', () => {
    const result = parseVtlFilename('Query.listItems.postAuth.5.res.vtl');
    expect(result).toBeDefined();
    expect(result!.kind).toBe('extended');
    expect((result as ParsedExtended).order).toBe(5);
    expect(typeof (result as ParsedExtended).order).toBe('number');
  });
});

describe('classifyVtlFiles', () => {
  it('classifies 4-segment files as overrides', () => {
    const result = classifyVtlFiles(['Mutation.createTodo.req.vtl', 'Query.getTodo.res.vtl']);
    expect(result.overrides).toHaveLength(2);
    expect(result.extended).toHaveLength(0);
    expect(result.overrides[0].kind).toBe('override');
    expect(result.overrides[1].kind).toBe('override');
  });

  it('classifies 6-segment files as extended', () => {
    const result = classifyVtlFiles(['Mutation.createTodo.init.1.req.vtl', 'Query.listItems.postAuth.2.res.vtl']);
    expect(result.overrides).toHaveLength(0);
    expect(result.extended).toHaveLength(2);
    expect(result.extended[0].kind).toBe('extended');
    expect(result.extended[1].kind).toBe('extended');
  });

  it('ignores files with other segment counts', () => {
    const result = classifyVtlFiles(['too.few.vtl', 'five.seg.ment.file.vtl', 'Mutation.createTodo.req.vtl']);
    expect(result.overrides).toHaveLength(1);
    expect(result.extended).toHaveLength(0);
  });

  it('throws for non-numeric order in extended resolver filename', () => {
    expect(() => classifyVtlFiles(['Mutation.createTodo.init.abc.req.vtl'])).toThrow(/Non-numeric order/);
  });

  it('throws for duplicate extended resolver (same typeName+fieldName+slot+order+templateType)', () => {
    expect(() => classifyVtlFiles(['Mutation.createTodo.init.1.req.vtl', 'Mutation.createTodo.init.1.req.vtl'])).toThrow(
      /Duplicate extended resolver/,
    );
  });

  it('handles mixed override and extended files correctly', () => {
    const result = classifyVtlFiles([
      'Mutation.createTodo.req.vtl',
      'Mutation.createTodo.init.1.req.vtl',
      'Query.getTodo.res.vtl',
      'Query.listItems.postAuth.2.res.vtl',
    ]);
    expect(result.overrides).toHaveLength(2);
    expect(result.extended).toHaveLength(2);
  });
});
