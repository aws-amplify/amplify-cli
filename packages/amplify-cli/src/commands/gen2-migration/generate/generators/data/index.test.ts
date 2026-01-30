import assert from 'node:assert';
import { printNodeArray } from '../../test_utils/ts_node_printer';
import { generateDataSource, DataDefinition } from './index';

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

  describe('authorization modes', () => {
    it('generates API_KEY auth mode with expiresInDays', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
            apiKeyConfig: {
              apiKeyExpirationDays: 42,
            },
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]apiKey['"]/);
      assert.match(source, /apiKeyAuthorizationMode: \{/);
      assert.match(source, /expiresInDays: 42/);
    });

    it('generates AWS_LAMBDA auth mode with timeToLiveInSeconds', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'AWS_LAMBDA',
            lambdaAuthorizerConfig: {
              ttlSeconds: 987,
            },
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]lambda['"]/);
      assert.match(source, /lambdaAuthorizationMode: \{/);
      assert.match(source, /timeToLiveInSeconds: 987/);
    });

    it('generates OPENID_CONNECT auth mode with oidcIssuerUrl and clientId', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'OPENID_CONNECT',
            openIDConnectConfig: {
              issuerUrl: 'https://unique-test-issuer-xyz789.auth0.com/',
              clientId: 'unique-client-id-abc123',
            },
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]oidc['"]/);
      assert.match(source, /oidcAuthorizationMode: \{/);
      assert.match(source, /oidcIssuerUrl: ['"]https:\/\/unique-test-issuer-xyz789\.auth0\.com\/['"]/);
      assert.match(source, /clientId: ['"]unique-client-id-abc123['"]/);
    });

    it('generates AMAZON_COGNITO_USER_POOLS auth mode', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]userPool['"]/);
    });

    it('generates AWS_IAM auth mode', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'AWS_IAM',
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]iam['"]/);
    });

    it('returns no authorizationModes when config is undefined', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.doesNotMatch(source, /authorizationModes/);
    });

    it('handles API_KEY without apiKeyConfig', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        authorizationModes: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
        } as DataDefinition['authorizationModes'],
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /defaultAuthorizationMode: ['"]apiKey['"]/);
      assert.doesNotMatch(source, /apiKeyAuthorizationMode/);
    });
  });

  describe('schema generation', () => {
    it('adds branchName variable when schema contains ${env}', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test @model { id: ID! env: String @default(value: "${env}") }',
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /const branchName = process\.env\.AWS_BRANCH \?\? "sandbox"/);
      assert.match(source, /\$\{branchName\}/);
      assert.doesNotMatch(source, /\$\{env\}/);
    });

    it('does not add branchName variable when schema does not contain ${env}', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test @model { id: ID! }',
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.doesNotMatch(source, /const branchName/);
    });
  });

  describe('logging configuration', () => {
    it('generates logging: true for boolean config', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        logging: true,
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /logging: true/);
    });

    it('generates logging object with fieldLogLevel', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        logging: {
          fieldLogLevel: 'debug',
        },
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /logging: \{/);
      assert.match(source, /fieldLogLevel: ['"]debug['"]/);
    });

    it('generates logging object with excludeVerboseContent', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
        logging: {
          fieldLogLevel: 'error',
          excludeVerboseContent: true,
        },
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.match(source, /logging: \{/);
      assert.match(source, /excludeVerboseContent: true/);
    });

    it('does not include logging when not configured', async () => {
      const dataDefinition: DataDefinition = {
        schema: 'type Test { id: ID! }',
      };
      const source = printNodeArray(await generateDataSource('main', dataDefinition));
      assert.doesNotMatch(source, /logging:/);
    });
  });
});
