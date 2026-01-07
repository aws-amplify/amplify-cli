import { describe, it, expect } from '@jest/globals';
import { BackendSynthesizer, BackendRenderParameters } from './synthesizer';
import { DynamoDBTableDefinition } from '../adapters/storage';
import { printNodeArray } from '../test_utils/ts_node_printer';
import ts from 'typescript';

describe('BackendSynthesizer', () => {
  let synthesizer: BackendSynthesizer;

  beforeEach(() => {
    synthesizer = new BackendSynthesizer();
  });

  describe('AppSync API Generation', () => {
    it('should set awsRegion to a dynamic value from backend', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          additionalAuthProviders: [
            {
              authenticationType: 'AMAZON_COGNITO_USER_POOLS',
              userPoolConfig: {
                awsRegion: 'us-east-1',
                userPoolId: 'userpool_1234',
              },
            },
          ],
        },
        auth: {
          importFrom: './auth/resource',
        },
      };

      const result = synthesizer.render(renderArgs);
      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { auth } from "./auth/resource";
        import { data } from "./data/resource";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({
            auth,
            data
        });
        const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
        cfnGraphqlApi.additionalAuthenticationProviders = [
            {
                authenticationType: "AMAZON_COGNITO_USER_POOLS",
                userPoolConfig: {
                    awsRegion: backend.auth.resources.userPool.stack.region,
                    userPoolId: backend.auth.resources.userPool.userPoolId
                }
            }
        ];
        "
      `);
    });
  });

  describe('REST API Generation', () => {
    it('should generate HttpApi with CORS configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET', 'POST'],
                  authType: 'private',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for CORS imports
      expect(output).toContain('CorsHttpMethod');
      expect(output).toContain('aws-cdk-lib/aws-apigatewayv2');

      // Check for HttpApi with CORS configuration
      expect(output).toContain('corsPreflight');
      expect(output).toContain('allowMethods');
      expect(output).toContain('allowOrigins');
      expect(output).toContain('allowHeaders');
      expect(output).toContain('CorsHttpMethod.GET');
      expect(output).toContain('CorsHttpMethod.POST');
      expect(output).toContain('CorsHttpMethod.PUT');
      expect(output).toContain('CorsHttpMethod.DELETE');
    });

    it('should map auth types to correct authorizers', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/private',
                  methods: ['GET'],
                  authType: 'private',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/protected',
                  methods: ['POST'],
                  authType: 'protected',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/open',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
        auth: {
          importFrom: './auth/resource',
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for authorizer creation
      expect(output).toContain('HttpIamAuthorizer');
      expect(output).toContain('HttpUserPoolAuthorizer');

      // Check for correct authorizer assignment
      expect(output).toContain('authorizer: iamAuthorizer');
      expect(output).toContain('authorizer: userPoolAuthorizer');
    });

    it('should generate unique integration names per function', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'function1', // Use function1 as default
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'function1',
                },
                {
                  path: '/books',
                  methods: ['POST'],
                  authType: 'open',
                  lambdaFunction: 'function2',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([
            ['function1', 'function'],
            ['function2', 'function'],
          ]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for unique integration names
      expect(output).toContain('function1Integration');
      expect(output).toContain('function2Integration');
      expect(output).toContain('backend.function1.resources');
      expect(output).toContain('backend.function2.resources');
    });

    it('should respect HTTP methods from path configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET', 'POST'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
                {
                  path: '/books',
                  methods: ['PUT', 'DELETE'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for specific HTTP methods
      expect(output).toContain('HttpMethod.GET');
      expect(output).toContain('HttpMethod.POST');
      expect(output).toContain('HttpMethod.PUT');
      expect(output).toContain('HttpMethod.DELETE');

      // Should not contain methods not specified
      expect(output).not.toContain('HttpMethod.PATCH');
      expect(output).not.toContain('HttpMethod.OPTIONS');
    });

    it('should generate IAM policy for all HttpApis', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
        auth: {
          importFrom: './auth/resource',
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for IAM policy creation
      expect(output).toContain('Policy');
      expect(output).toContain('PolicyStatement');
      expect(output).toContain('execute-api:Invoke');
      expect(output).toContain('arnForExecuteApi');

      // Check for policy attachment
      expect(output).toContain('authenticatedUserIamRole');
      expect(output).toContain('unauthenticatedUserIamRole');
      expect(output).toContain('attachInlinePolicy');
    });

    it('should generate backend output for client configuration', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Check for backend output generation
      expect(output).toContain('backend.addOutput');
      expect(output).toContain('api');
      expect(output).toContain('REST');
      expect(output).toContain('endpoint');
      expect(output).toContain('region');
    });

    it('should skip routes for non-existent functions', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'existingFunction', // Use existing function as default
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'existingFunction',
                },
                {
                  path: '/missing',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'nonExistentFunction',
                },
              ],
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['existingFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Should contain route for existing function
      expect(output).toContain('/items');
      expect(output).toContain('existingFunction');

      // Should not contain route for non-existent function
      expect(output).not.toContain('/missing');
      expect(output).not.toContain('nonExistentFunction');
    });

    it('should respect CORS configuration from Gen1 project', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
              corsConfiguration: {
                allowOrigins: ['https://example.com'],
                allowMethods: ['GET', 'POST'],
                allowHeaders: ['content-type', 'authorization'],
              },
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Should contain specific CORS configuration
      expect(output).toContain('https://example.com');
      expect(output).toContain('CorsHttpMethod.GET');
      expect(output).toContain('CorsHttpMethod.POST');
      expect(output).toContain('content-type');
      expect(output).toContain('authorization');

      // Should not contain wildcard CORS
      expect(output).not.toContain('CorsHttpMethod.ANY');
    });

    it('should use default CORS configuration when not specified in Gen1', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
          restApis: [
            {
              apiName: 'testapi',
              functionName: 'testFunction',
              paths: [
                {
                  path: '/items',
                  methods: ['GET'],
                  authType: 'open',
                  lambdaFunction: 'testFunction',
                },
              ],
              // No corsConfiguration specified
            },
          ],
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['testFunction', 'function']]),
        },
      };

      const result = synthesizer.render(renderArgs);
      const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest);
      const printer = ts.createPrinter();
      const output = printer.printList(ts.ListFormat.SourceFileStatements, result, sourceFile);

      // Should contain default CORS configuration
      expect(output).toContain('corsPreflight');
      expect(output).toContain('CorsHttpMethod.GET');
      expect(output).toContain('CorsHttpMethod.POST');
      expect(output).toContain('CorsHttpMethod.PUT');
      expect(output).toContain('CorsHttpMethod.DELETE');
      expect(output).toContain('content-type');
      expect(output).toContain('authorization');
    });
  });

  describe('DynamoDB table generation', () => {
    it('should generate table with underscores in name', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'countsTable-dev',
        partitionKey: { name: 'postId', type: 'STRING' },
        sortKey: { name: 'metricType', type: 'STRING' },
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "countsTable", { partitionKey: { name: "postId", type: AttributeType.STRING }, billingMode: BillingMode.PROVISIONED, readCapacity: 5, writeCapacity: 5, sortKey: { name: "metricType", type: AttributeType.STRING } });
        "
      `);
    });

    it('should generate table with partition key and sort key', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'testTable',
        partitionKey: { name: 'id', type: 'STRING' },
        sortKey: { name: 'timestamp', type: 'NUMBER' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "testTable", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST, sortKey: { name: "timestamp", type: AttributeType.NUMBER } });
        "
      `);
    });

    it('should generate table with GSI', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'testTable',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
        gsis: [
          {
            indexName: 'testIndex',
            partitionKey: { name: 'gsiPK', type: 'STRING' },
            sortKey: { name: 'gsiSK', type: 'NUMBER' },
          },
        ],
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        const testTable = new Table(storageStack, "testTable", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PROVISIONED, readCapacity: 5, writeCapacity: 5 });
        testTable.addGlobalSecondaryIndex({ indexName: "testIndex", partitionKey: { name: "gsiPK", type: AttributeType.STRING }, sortKey: { name: "gsiSK", type: AttributeType.NUMBER }, readCapacity: 5, writeCapacity: 5 });
        "
      `);
    });

    it('should generate table with stream configuration', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'streamTable',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "streamTable", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST, stream: StreamViewType.NEW_AND_OLD_IMAGES });
        "
      `);
    });

    it('should handle multiple tables with different configurations', () => {
      const tables: DynamoDBTableDefinition[] = [
        {
          tableName: 'table-one',
          partitionKey: { name: 'pk1', type: 'STRING' },
          billingMode: 'PAY_PER_REQUEST',
        },
        {
          tableName: 'table-two',
          partitionKey: { name: 'pk2', type: 'NUMBER' },
          sortKey: { name: 'sk2', type: 'STRING' },
          billingMode: 'PROVISIONED',
          readCapacity: 10,
          writeCapacity: 10,
        },
      ];

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: tables,
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "table", { partitionKey: { name: "pk1", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        new Table(storageStack, "table", { partitionKey: { name: "pk2", type: AttributeType.NUMBER }, billingMode: BillingMode.PROVISIONED, readCapacity: 10, writeCapacity: 10, sortKey: { name: "sk2", type: AttributeType.STRING } });
        "
      `);
    });

    it('should include required CDK imports for DynamoDB', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'importTest',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "importTest", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        "
      `);
    });

    it('should create storage stack when no S3 bucket exists', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'stackTest',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "stackTest", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        "
      `);
    });

    it('should use existing storage stack when S3 bucket exists', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'stackTest',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
          hasS3Bucket: 'testBucket',
          bucketName: 'testBucket',
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { storage } from "./storage/resource";
        import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({
            storage
        });
        const storageStack = backend.storage.stack;
        new Table(storageStack, "stackTest", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
        // Use this bucket name post refactor
        // s3Bucket.bucketName = 'testBucket';
        "
      `);
    });
  });

  describe('Table name transformation', () => {
    it('should replace multiple hyphens with underscores', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'my-complex-table-name-dev',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "my_complex_table_name", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        "
      `);
    });

    it('should handle table names without hyphens', () => {
      const tableDefinition: DynamoDBTableDefinition = {
        tableName: 'simpleTableName',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };

      const result = synthesizer.render({
        storage: {
          importFrom: './storage/resource',
          dynamoTables: [tableDefinition],
        },
      });

      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { Table, AttributeType, BillingMode, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({});
        const storageStack = backend.createStack("storage");
        new Table(storageStack, "simpleTableName", { partitionKey: { name: "id", type: AttributeType.STRING }, billingMode: BillingMode.PAY_PER_REQUEST });
        "
      `);
    });
  });
});
