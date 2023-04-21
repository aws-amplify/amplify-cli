import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { IDynamoDBService } from '@aws-amplify/amplify-util-import';
import DynamoDB, { ListTablesInput, ListTablesOutput, TableDescription, TableName } from 'aws-sdk/clients/dynamodb';
import { loadConfiguration } from '../configuration-manager';
import { pagedAWSCall } from './paged-call';

export const createDynamoDBService = async (context: $TSContext, options: $TSAny): Promise<DynamoDBService> => {
  let credentials = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const dynamoDB = new DynamoDB({ ...credentials, ...options });

  return new DynamoDBService(dynamoDB);
};

export class DynamoDBService implements IDynamoDBService {
  private cachedTableList: string[] = [];

  public constructor(private dynamoDB: DynamoDB) {}

  public async listTables(): Promise<TableName[]> {
    if (this.cachedTableList.length === 0) {
      const result = await pagedAWSCall<ListTablesOutput, TableName, TableName>(
        async (params: ListTablesInput, nextToken: TableName) => {
          return await this.dynamoDB
            .listTables({
              ...params,
              ExclusiveStartTableName: nextToken,
            })
            .promise();
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
    const response = await this.dynamoDB
      .describeTable({
        TableName: tableName,
      })
      .promise();

    return response.Table;
  }

  public async tableExists(tableName: string): Promise<boolean> {
    const tables = await this.listTables();

    return tables.includes(tableName);
  }
}
