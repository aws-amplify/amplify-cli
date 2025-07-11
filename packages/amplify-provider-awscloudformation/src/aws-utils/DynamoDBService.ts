import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { IDynamoDBService } from '@aws-amplify/amplify-util-import';
import {
  DynamoDBClient,
  ListTablesCommand,
  ListTablesCommandInput,
  ListTablesCommandOutput,
  DescribeTableCommand,
  TableDescription,
} from '@aws-sdk/client-dynamodb';
import { loadConfiguration } from '../configuration-manager';
import { pagedAWSCall } from './paged-call';

export const createDynamoDBService = async (context: $TSContext, options: $TSAny): Promise<DynamoDBService> => {
  let credentials = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const dynamoDBClient = new DynamoDBClient({
    ...credentials,
    ...options,
  });

  return new DynamoDBService(dynamoDBClient);
};

export class DynamoDBService implements IDynamoDBService {
  private cachedTableList: string[] = [];

  public constructor(private dynamoDBClient: DynamoDBClient) {}

  public async listTables(): Promise<string[]> {
    if (this.cachedTableList.length === 0) {
      const result = await pagedAWSCall<ListTablesCommandOutput, string, string>(
        async (params: ListTablesCommandInput, nextToken: string) => {
          const command = new ListTablesCommand({
            ...params,
            ExclusiveStartTableName: nextToken,
          });
          return await this.dynamoDBClient.send(command);
        },
        {
          Limit: 100,
        },
        (response) => response?.TableNames,
        async (response) => response?.LastEvaluatedTableName,
      );

      this.cachedTableList.push(...result!);
    }

    return this.cachedTableList;
  }

  public async getTableDetails(tableName: string): Promise<TableDescription> {
    const command = new DescribeTableCommand({
      TableName: tableName,
    });
    const response = await this.dynamoDBClient.send(command);

    return response.Table;
  }

  public async tableExists(tableName: string): Promise<boolean> {
    const tables = await this.listTables();

    return tables.includes(tableName);
  }
}
