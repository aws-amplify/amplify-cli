import { DataRenderer } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

describe('DataRenderer', () => {
  const renderer = new DataRenderer('main');

  function render(...args: Parameters<DataRenderer['render']>): string {
    return TS.printNodes(renderer.render(...args));
  }

  it('renders a basic defineData resource with schema and table mappings', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! title: String! }',
      tableMappings: { Todo: 'Todo-abc123-main' },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! title: String! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: { Todo: 'Todo-abc123-main' },
          },
        ],
        schema,
      });
      "
    `);
  });

  it('renders authorization modes with default auth type', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: { Todo: 'Todo-abc-main' },
      authorizationModes: {
        defaultAuthentication: { authenticationType: 'AMAZON_COGNITO_USER_POOLS' },
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
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

  it('renders API key auth mode with expiration and description', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      authorizationModes: {
        defaultAuthentication: {
          authenticationType: 'API_KEY',
          apiKeyConfig: { apiKeyExpirationDays: 30, description: 'My API Key' },
        },
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
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

  it('renders OIDC auth mode', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
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

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
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

  it('renders Lambda auth mode', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      authorizationModes: {
        additionalAuthenticationProviders: [
          {
            authenticationType: 'AWS_LAMBDA',
            lambdaAuthorizerConfig: { lambdaFunction: 'myAuthFn', ttlSeconds: 300 },
          },
        ],
      },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
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

  it('renders logging config', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      logging: { fieldLogLevel: 'error', excludeVerboseContent: true },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
          },
        ],
        logging: { fieldLogLevel: 'error', excludeVerboseContent: true },
        schema,
      });
      "
    `);
  });

  it('renders logging: true as a boolean', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      logging: true,
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
          },
        ],
        logging: true,
        schema,
      });
      "
    `);
  });

  it('replaces ${env} with ${branchName} in schema and adds branchName declaration', () => {
    const output = render({
      schema: 'type Todo @model { env: String @default(value: "${env}") }',
      tableMappings: {},
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';
      const schema = \`type Todo @model { env: String @default(value: "\${branchName}") }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {},
          },
        ],
        schema,
      });
      "
    `);
    expect(output).not.toContain('${env}');
  });

  it('does not emit branchName when schema has no ${env}', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
    });

    expect(output).not.toContain('const branchName');
  });

  it('renders multiple table mappings', () => {
    const output = render({
      schema: 'type Todo @model { id: ID! } type Post @model { id: ID! }',
      tableMappings: { Todo: 'Todo-abc-main', Post: 'Post-def-main' },
    });

    expect(output).toMatchInlineSnapshot(`
      "import { defineData } from '@aws-amplify/backend';

      const schema = \`type Todo @model { id: ID! } type Post @model { id: ID! }\`;

      export const data = defineData({
        migratedAmplifyGen1DynamoDbTableMappings: [
          {
            //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
            branchName: 'main',
            modelNameToTableNameMapping: {
              Todo: 'Todo-abc-main',
              Post: 'Post-def-main',
            },
          },
        ],
        schema,
      });
      "
    `);
  });
});
