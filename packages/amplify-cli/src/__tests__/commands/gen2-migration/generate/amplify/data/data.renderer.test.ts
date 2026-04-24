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

  describe('extended resolver rendering', () => {
    it('renderNoneDataSource produces correct output', () => {
      const node = renderer.renderNoneDataSource();
      const output = TS.printNode(node);
      expect(output).toMatchInlineSnapshot(`"const noneDataSource = backend.data.resources.graphqlApi.addNoneDataSource("none");"`);
    });

    it('renderAppsyncFunction with both templates', () => {
      const node = renderer.renderAppsyncFunction({
        typeName: 'Query',
        fieldName: 'listProducts',
        slot: 'postAuth',
        order: 2,
        requestFile: 'Query.listProducts.postAuth.2.req.vtl',
        responseFile: 'Query.listProducts.postAuth.2.res.vtl',
        spliceIndex: 2,
      });
      const output = TS.printNode(node);
      expect(output).toMatchInlineSnapshot(`
        "const QuerylistProductspostAuth2 = new aws_appsync.AppsyncFunction(backend.data.stack, "QuerylistProductspostAuth2", {
            name: "QuerylistProductspostAuth2",
            api: backend.data.resources.graphqlApi,
            dataSource: noneDataSource,
            requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(join(resolversDir, "Query.listProducts.postAuth.2.req.vtl")),
            responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(join(resolversDir, "Query.listProducts.postAuth.2.res.vtl"))
        });"
      `);
    });

    it('renderAppsyncFunction with only request template', () => {
      const node = renderer.renderAppsyncFunction({
        typeName: 'Query',
        fieldName: 'listProducts',
        slot: 'postAuth',
        order: 1,
        requestFile: 'Query.listProducts.postAuth.1.req.vtl',
        responseFile: undefined,
        spliceIndex: 2,
      });
      const output = TS.printNode(node);
      expect(output).toContain('MappingTemplate.fromFile(join(resolversDir, "Query.listProducts.postAuth.1.req.vtl"))');
      expect(output).toContain('MappingTemplate.fromString("$util.toJson($ctx.prev.result)")');
    });

    it('renderAppsyncFunction with only response template', () => {
      const node = renderer.renderAppsyncFunction({
        typeName: 'Query',
        fieldName: 'listProducts',
        slot: 'postAuth',
        order: 1,
        requestFile: undefined,
        responseFile: 'Query.listProducts.postAuth.1.res.vtl',
        spliceIndex: 2,
      });
      const output = TS.printNode(node);
      expect(output).toContain('MappingTemplate.fromString("$util.toJson({})")');
      expect(output).toContain('MappingTemplate.fromFile(join(resolversDir, "Query.listProducts.postAuth.1.res.vtl"))');
    });

    it('renderSpliceStatements for single function', () => {
      const statements = renderer.renderSpliceStatements('Query', 'listProducts', [
        { constructName: 'QuerylistProductspostAuth2', spliceIndex: 2 },
      ]);
      const output = statements.map((s) => TS.printNode(s));

      // Resolver access
      expect(output[0]).toMatchInlineSnapshot(
        `"const queryListProductsResolver = backend.data.resources.cfnResources.cfnResolvers["Query.listProducts"] as CfnResolver;"`,
      );
      // Pipeline functions extraction
      expect(output[1]).toMatchInlineSnapshot(
        `"const queryListProductsPipelineFunctions = (queryListProductsResolver.pipelineConfig as CfnResolver.PipelineConfigProperty).functions || [];"`,
      );
      // Splice call
      expect(output[2]).toMatchInlineSnapshot(`"queryListProductsPipelineFunctions.splice(2, 0, QuerylistProductspostAuth2.functionId);"`);
      // Pipeline config reassignment
      expect(output[3]).toMatchInlineSnapshot(
        `"queryListProductsResolver.pipelineConfig = { functions: queryListProductsPipelineFunctions };"`,
      );
    });

    it('renderSpliceStatements for multiple functions', () => {
      const statements = renderer.renderSpliceStatements('Query', 'listProducts', [
        { constructName: 'QuerylistProductspostAuth1', spliceIndex: 2 },
        { constructName: 'QuerylistProductspostDataLoad1', spliceIndex: 4 },
      ]);
      const output = statements.map((s) => TS.printNode(s));

      // 2 (resolver + pipeline) + 2 (splice calls) + 1 (reassignment) = 5
      expect(output).toHaveLength(5);
      expect(output[2]).toContain('splice(2, 0, QuerylistProductspostAuth1.functionId)');
      expect(output[3]).toContain('splice(4, 0, QuerylistProductspostDataLoad1.functionId)');
    });
  });
});
