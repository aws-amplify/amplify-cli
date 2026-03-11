import { DataRenderer } from '../../../../../../commands/gen2-migration/generate-new/output/data/data.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('DataRenderer', () => {
  const renderer = new DataRenderer('main');

  it('renders a basic defineData resource with schema and table mappings', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! title: String! }',
      tableMappings: { Todo: 'Todo-abc123-main' },
    });
    const output = printNodes(nodes);

    expect(output).toContain('defineData');
    expect(output).toContain('Todo');
    expect(output).toContain('Todo-abc123-main');
    expect(output).toContain('migratedAmplifyGen1DynamoDbTableMappings');
    expect(output).toContain("branchName: 'main'");
  });

  it('renders authorization modes with default auth type', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: { Todo: 'Todo-abc-main' },
      authorizationModes: {
        defaultAuthentication: { authenticationType: 'AMAZON_COGNITO_USER_POOLS' },
      },
    });
    const output = printNodes(nodes);

    expect(output).toContain('authorizationModes');
    expect(output).toContain("defaultAuthorizationMode: 'userPool'");
  });

  it('renders API key auth mode with expiration and description', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      authorizationModes: {
        defaultAuthentication: {
          authenticationType: 'API_KEY',
          apiKeyConfig: { apiKeyExpirationDays: 30, description: 'My API Key' },
        },
      },
    });
    const output = printNodes(nodes);

    expect(output).toContain("defaultAuthorizationMode: 'apiKey'");
    expect(output).toContain('apiKeyAuthorizationMode');
    expect(output).toContain('expiresInDays');
    expect(output).toContain("description: 'My API Key'");
  });

  it('renders OIDC auth mode', () => {
    const nodes = renderer.render({
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
    const output = printNodes(nodes);

    expect(output).toContain('oidcAuthorizationMode');
    expect(output).toContain("oidcProviderName: 'MyOIDC'");
    expect(output).toContain("oidcIssuerUrl: 'https://example.com'");
    expect(output).toContain("clientId: 'client123'");
  });

  it('renders Lambda auth mode', () => {
    const nodes = renderer.render({
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
    const output = printNodes(nodes);

    expect(output).toContain('lambdaAuthorizationMode');
    expect(output).toContain('myAuthFn');
    expect(output).toContain('timeToLiveInSeconds');
  });

  it('renders logging config', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      logging: { fieldLogLevel: 'error', excludeVerboseContent: true },
    });
    const output = printNodes(nodes);

    expect(output).toContain('logging');
    expect(output).toContain("fieldLogLevel: 'error'");
    expect(output).toContain('excludeVerboseContent: true');
  });

  it('renders logging: true as a boolean', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
      logging: true,
    });
    const output = printNodes(nodes);

    expect(output).toContain('logging: true');
  });

  it('replaces ${env} with ${branchName} in schema', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { env: String @default(value: "${env}") }',
      tableMappings: {},
    });
    const output = printNodes(nodes);

    expect(output).toContain('branchName');
    expect(output).not.toContain('${env}');
  });

  it('does not emit branchName when schema has no ${env}', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! }',
      tableMappings: {},
    });
    const output = printNodes(nodes);

    expect(output).not.toContain('const branchName');
  });

  it('renders multiple table mappings', () => {
    const nodes = renderer.render({
      schema: 'type Todo @model { id: ID! } type Post @model { id: ID! }',
      tableMappings: { Todo: 'Todo-abc-main', Post: 'Post-def-main' },
    });
    const output = printNodes(nodes);

    expect(output).toContain('Todo');
    expect(output).toContain('Post');
    expect(output).toContain('Todo-abc-main');
    expect(output).toContain('Post-def-main');
  });
});
