import { describe, it, expect } from '@jest/globals';
import { BackendSynthesizer, BackendRenderParameters } from './synthesizer';
import { DynamoDBTableDefinition } from '../adapters/storage';
import { printNodeArray } from '../test_utils/ts_node_printer';

describe('BackendSynthesizer', () => {
  let synthesizer: BackendSynthesizer;

  beforeEach(() => {
    synthesizer = new BackendSynthesizer();
  });

  describe('identity pool overrides', () => {
    it('allowUnauthenticatedIdentities is escape hatched if guest login is false', () => {
      const renderArgs: BackendRenderParameters = {
        auth: {
          importFrom: './auth/resource',
          guestLogin: false,
        },
      };

      const result = synthesizer.render(renderArgs);
      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { auth } from "./auth/resource";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({
            auth
        });
        const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
        cfnIdentityPool.allowUnauthenticatedIdentities = false;
        "
      `);
    });

    it('cfnIdentityPool is not declared as a const if guest login is true', () => {
      const renderArgs: BackendRenderParameters = {
        auth: {
          importFrom: './auth/resource',
          guestLogin: true,
        },
      };

      const result = synthesizer.render(renderArgs);
      const source = printNodeArray(result);
      expect(source).toMatchInlineSnapshot(`
        "import { auth } from "./auth/resource";
        import { defineBackend } from "@aws-amplify/backend";


        const backend = defineBackend({
            auth
        });
        "
      `);
    });
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
        // Add this property to the Table above post refactor: tableName: 'countsTable-dev'
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
        // Add this property to the Table above post refactor: tableName: 'testTable'
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
        // Add this property to the Table above post refactor: tableName: 'testTable'
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
        // Add this property to the Table above post refactor: tableName: 'streamTable'
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
        // Add this property to the Table above post refactor: tableName: 'table-one'
        new Table(storageStack, "table", { partitionKey: { name: "pk2", type: AttributeType.NUMBER }, billingMode: BillingMode.PROVISIONED, readCapacity: 10, writeCapacity: 10, sortKey: { name: "sk2", type: AttributeType.STRING } });
        // Add this property to the Table above post refactor: tableName: 'table-two'
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
        // Add this property to the Table above post refactor: tableName: 'importTest'
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
        // Add this property to the Table above post refactor: tableName: 'stackTest'
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
        // Add this property to the Table above post refactor: tableName: 'stackTest'
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
        // Add this property to the Table above post refactor: tableName: 'my-complex-table-name-dev'
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
        // Add this property to the Table above post refactor: tableName: 'simpleTableName'
        "
      `);
    });
  });

  describe('DynamoDB Triggers', () => {
    it('should generate escape hatches for DynamoDB triggers', () => {
      const renderArgs: BackendRenderParameters = {
        data: {
          importFrom: './data/resource',
        },
        function: {
          importFrom: './function/resource',
          functionNamesAndCategories: new Map([['recordUserActivity', 'function']]),
        },
        dynamoTriggers: [
          {
            functionName: 'recordUserActivity',
            models: ['Comment', 'Post', 'Topic', 'randomTable'],
          },
        ],
      };

      const result = synthesizer.render(renderArgs);
      const source = printNodeArray(result);
      expect(source).toMatchSnapshot();
    });
  });
});
