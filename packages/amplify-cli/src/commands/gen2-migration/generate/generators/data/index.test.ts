import assert from 'node:assert';
import { printNodeArray } from '../../test_utils/ts_node_printer';
import { generateDataSource } from './index';

// Mock AWS SDK
jest.mock('@aws-sdk/client-appsync', () => ({
  AppSyncClient: jest.fn(),
  paginateListGraphqlApis: jest.fn().mockReturnValue([]),
}));

describe('Data Category code generation', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('generates the correct import', async () => {
    const tableMappings = { Todo: 'my-todo-mapping' };
    const source = printNodeArray(await generateDataSource('main', { tableMappings, schema: 'type Test { id: ID! }' }));
    assert.match(source, /import\s?\{\s?defineData\s?\}\s?from\s?"\@aws-amplify\/backend"/);
  });

  it('returns undefined when no data definition provided', async () => {
    const result = await generateDataSource('main');
    assert.strictEqual(result, undefined);
  });

  it('returns undefined when no schema and no REST APIs', async () => {
    const result = await generateDataSource('main', {});
    assert.strictEqual(result, undefined);
  });
  describe('import map', () => {
    it('is rendered', async () => {
      const tableMappings = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(await generateDataSource('main', { tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /migratedAmplifyGen1DynamoDbTableMappings: \[\{\n\s+\/\/.*\n\s+branchName: ['"]\w+['"],\n\s+modelNameToTableNameMapping: { Todo: ['"]my-todo-mapping['"] }\n\s+}]/,
      );
    });
    it('includes multiple models in table mappings', async () => {
      const tableMappings = { Todo: 'Todo-abc123-dev', User: 'User-abc123-dev', Post: 'Post-abc123-dev' };
      const source = printNodeArray(await generateDataSource('main', { tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /modelNameToTableNameMapping: { Todo: ['"]Todo-abc123-dev['"], User: ['"]User-abc123-dev['"], Post: ['"]Post-abc123-dev['"] }/,
      );
    });
    it('has each each key in defineData', async () => {
      const tableMappings = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(await generateDataSource('main', { tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /const schema = `schema`;\n\nexport const data = defineData\(\{\n\s+migratedAmplifyGen1DynamoDbTableMappings: \[\{\n\s+\/\/.*\n\s+branchName: ['"]\w+['"],\n\s+modelNameToTableNameMapping: { Todo: ['"]my-todo-mapping['"] }\n\s+}],\n\s+schema\n\}\)/,
      );
    });
  });
});
describe('authorization modes', () => {
  it('generates API key config', async () => {
    const authorizationModes = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
        apiKeyConfig: { apiKeyExpirationDays: 7 },
      },
    };
    const source = printNodeArray(
      // Using 'as any' because we're testing with Gen 1 auth format but TypeScript expects Gen 2 AuthorizationModes type
      await generateDataSource('main', { schema: 'type Test { id: ID! }', authorizationModes: authorizationModes as any }),
    );
    assert.match(source, /defaultAuthorizationMode: "apiKey"/);
    assert.match(source, /apiKeyAuthorizationMode: { expiresInDays: 7 }/);
  });

  it('generates additional auth providers', async () => {
    const authorizationModes = {
      defaultAuthentication: { authenticationType: 'AMAZON_COGNITO_USER_POOLS' },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'API_KEY',
          apiKeyConfig: { apiKeyExpirationDays: 30 },
        },
      ],
    };
    const source = printNodeArray(
      // Using 'as any' because we're testing with Gen 1 auth format but TypeScript expects Gen 2 AuthorizationModes type
      await generateDataSource('main', { schema: 'type Test { id: ID! }', authorizationModes: authorizationModes as any }),
    );
    assert.match(source, /defaultAuthorizationMode: "userPool"/);
    assert.match(source, /apiKeyAuthorizationMode: { expiresInDays: 30 }/);
  });
});
