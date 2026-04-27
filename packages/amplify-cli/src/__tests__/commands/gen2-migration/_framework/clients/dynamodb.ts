import { mockClient } from 'aws-sdk-client-mock';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { MigrationApp } from '../app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

/**
 * Mock for the Amazon DynamoDB service client (`@aws-sdk/client-dynamodb`).
 *
 * Mocks one command:
 *
 * - `DescribeTableCommand`: Returns the table description including key schema,
 *   attribute definitions, global secondary indexes (GSIs), provisioned throughput,
 *   billing mode, and stream configuration.
 *
 * The mock works by:
 * 1. Finding the storage resource in `amplify-meta.json` whose `output.Name`
 *    matches the requested `TableName`.
 * 2. Reading the resource's CloudFormation template.
 * 3. Extracting the `DynamoDBTable` resource properties and mapping them to
 *    the `DescribeTable` response format.
 *
 * This approach handles apps with multiple DynamoDB tables — each table is
 * identified by its deployed table name from `amplify-meta.json`, not by the
 * Amplify resource name.
 *
 * Source files:
 * - `amplify-meta.json`: `storage.<resourceName>.output.Name` (the deployed table name)
 * - `storage/<name>/build/<name>-cloudformation-template.json`: `DynamoDBTable` resource
 *   properties (KeySchema, AttributeDefinitions, GlobalSecondaryIndexes,
 *   ProvisionedThroughput, BillingMode, StreamSpecification)
 */
export class DynamoDBMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(dynamodb.DynamoDBClient);
    this.mockDescribeTable();
  }

  private mockDescribeTable() {
    this.mock
      .on(dynamodb.DescribeTableCommand)
      .callsFake(async (input: dynamodb.DescribeTableCommandInput): Promise<dynamodb.DescribeTableCommandOutput> => {
        const stackName = this.app.clients.cloudformation.stackNameForResource(input.TableName!);
        const templatePath = this.app.templatePathForStack(stackName);
        const template = JSONUtilities.readJson<any>(templatePath);
        const tableProps = template.Resources.DynamoDBTable.Properties;

        const gsis: dynamodb.GlobalSecondaryIndexDescription[] | undefined = tableProps.GlobalSecondaryIndexes?.map((gsi: any) => ({
          IndexName: gsi.IndexName,
          KeySchema: gsi.KeySchema,
          Projection: gsi.Projection,
          ProvisionedThroughput: gsi.ProvisionedThroughput
            ? {
                ReadCapacityUnits: gsi.ProvisionedThroughput.ReadCapacityUnits,
                WriteCapacityUnits: gsi.ProvisionedThroughput.WriteCapacityUnits,
              }
            : undefined,
        }));

        return {
          Table: {
            TableName: input.TableName,
            AttributeDefinitions: tableProps.AttributeDefinitions,
            KeySchema: tableProps.KeySchema,
            GlobalSecondaryIndexes: gsis,
            ProvisionedThroughput: tableProps.ProvisionedThroughput
              ? {
                  ReadCapacityUnits: tableProps.ProvisionedThroughput.ReadCapacityUnits,
                  WriteCapacityUnits: tableProps.ProvisionedThroughput.WriteCapacityUnits,
                }
              : undefined,
            BillingModeSummary: tableProps.BillingMode ? { BillingMode: tableProps.BillingMode } : undefined,
            StreamSpecification: tableProps.StreamSpecification
              ? {
                  StreamEnabled: true,
                  StreamViewType: tableProps.StreamSpecification.StreamViewType,
                }
              : undefined,
          },
          $metadata: {},
        };
      });
  }
}
