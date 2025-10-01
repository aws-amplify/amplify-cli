import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { AmplifyAppSyncSimulatorDataLoader } from '..';

type DynamoDBConnectionConfig = {
  endpoint: string;
  region: 'us-fake-1';
  credentials: {
    accessKeyId: 'fake';
    secretAccessKey: 'fake';
  };
  tableName: string;
};
type DynamoDBLoaderConfig = {
  config: DynamoDBConnectionConfig;
  options: object;
};
export class DynamoDBDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(private ddbConfig: DynamoDBLoaderConfig) {
    const { tableName, endpoint } = ddbConfig.config;
    if (!tableName || !endpoint) {
      throw new Error(`Invalid DynamoDBConfig ${JSON.stringify(ddbConfig, null, 4)}`);
    }
    this.tableName = tableName;
    const ddbClient = new DynamoDBClient({
      ...ddbConfig.config,
      ...ddbConfig.options,
    });
    this.client = DynamoDBDocumentClient.from(ddbClient);
  }

  async load(payload): Promise<object | null> {
    try {
      switch (payload.operation) {
        case 'GetItem':
          return await this.getItem(payload);
        case 'PutItem':
          return await this.putItem(payload);
        case 'UpdateItem':
          return await this.updateItem(payload);
        case 'DeleteItem':
          return await this.deleteItem(payload);
        case 'Query':
          return await this.query(payload);
        case 'Scan':
          return await this.scan(payload);
        case 'DeleteAllItems':
          return await this.deleteAllItems();

        case 'BatchGetItem':
        case 'BatchPutItem':
        case 'BatchDeleteItem':
          throw new Error(`Operation  ${payload.operation} not implemented`);
        default:
          throw new Error(`Unknown operation name: ${payload.operation}`);
      }
    } catch (e) {
      if (e.name) {
        console.log('Error while executing Local DynamoDB');
        console.log(JSON.stringify(payload, null, 4));
        console.log(e);
        e.extensions = { errorType: 'DynamoDB:' + e.name };
      }
      throw e;
    }
  }
  // Deletes all records from the DynamoDB local table
  private async deleteAllItems(): Promise<object | null> {
    try {
      const items = await this.getAllItems();
      for await (const item of items) {
        await this.client.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: { id: item.id },
            ReturnValues: 'ALL_OLD',
          }),
        );
      }
    } catch (e) {
      throw new Error(`Error while deleting all items from ${this.tableName}`);
    }
    return [this.tableName];
  }
  // Gets all the records from the DynamoDB local table
  private async getAllItems(): Promise<Array<Record<string, any>> | null> {
    let items = [];
    let data = await this.client.send(new ScanCommand({ TableName: this.tableName }));
    items = [...items, ...data.Items];
    while (typeof data.LastEvaluatedKey !== 'undefined') {
      data = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: data.LastEvaluatedKey,
        }),
      );
      items = [...items, ...data.Items];
    }
    return items;
  }

  private async getItem(payload: any): Promise<object | null> {
    const { consistentRead = false } = payload;
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: payload.key,
        ConsistentRead: consistentRead,
      }),
    );

    return result.Item || null;
  }

  private async putItem(payload): Promise<object | null> {
    const {
      key,
      attributeValues,
      condition: {
        // we only provide limited support for condition update expressions.
        expression = undefined,
        expressionNames = undefined,
        expressionValues = undefined,
      } = {},
    } = payload;

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...key,
          ...attributeValues,
        },
        ConditionExpression: expression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      }),
    );

    // put does not return us anything useful so we need to fetch the object.
    return this.getItem({ key, consistentRead: true });
  }
  private async query({ query: keyCondition, filter, index, nextToken, limit, scanIndexForward = true, consistentRead = false, select }) {
    keyCondition = keyCondition || { expression: null };
    filter = filter || { expression: null };

    const params = {
      TableName: this.tableName,
      KeyConditionExpression: keyCondition.expression,
      FilterExpression: filter.expression,
      ExpressionAttributeValues: {
        ...(filter.expressionValues || {}),
        ...(keyCondition.expressionValues || {}),
      },
      ExpressionAttributeNames: {
        ...(filter.expressionNames || {}),
        ...(keyCondition.expressionNames || {}),
      },
      ExclusiveStartKey: nextToken,
      IndexName: index,
      Limit: limit,
      ConsistentRead: consistentRead,
      ScanIndexForward: scanIndexForward,
      Select: select || 'ALL_ATTRIBUTES',
    };

    // Remove empty objects
    if (Object.keys(params.ExpressionAttributeValues).length === 0) delete params.ExpressionAttributeValues;
    if (Object.keys(params.ExpressionAttributeNames).length === 0) delete params.ExpressionAttributeNames;

    const {
      Items: items,
      ScannedCount: scannedCount,
      LastEvaluatedKey: resultNextToken = null,
    } = await this.client.send(new QueryCommand(params));

    return {
      items: items || [],
      scannedCount,
      nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
    };
  }

  private async updateItem(payload) {
    const { key, update = {}, condition = {} } = payload;

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: update.expression,
      ConditionExpression: condition.expression,
      ReturnValues: 'ALL_NEW',
      ExpressionAttributeNames: {
        ...(condition.expressionNames || {}),
        ...(update.expressionNames || {}),
      },
      ExpressionAttributeValues: {
        ...(condition.expressionValues || {}),
        ...(update.expressionValues || {}),
      },
    };

    const { Attributes: updated } = await this.client.send(new UpdateCommand(params));
    return updated;
  }

  private async deleteItem(payload) {
    const {
      key,
      condition: {
        // we only provide limited support for condition update expressions.
        expression = undefined,
        expressionNames = undefined,
        expressionValues = undefined,
      } = {},
    } = payload;
    const { Attributes: deleted } = await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: key,
        ReturnValues: 'ALL_OLD',
        ConditionExpression: expression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      }),
    );

    return deleted;
  }

  private async scan(payload) {
    const { filter, index, limit, consistentRead = false, nextToken, select, totalSegments, segment } = payload;

    const params = {
      TableName: this.tableName,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
      IndexName: index,
      Limit: limit,
      ConsistentRead: consistentRead,
      Select: select || 'ALL_ATTRIBUTES',
      Segment: segment,
      TotalSegments: totalSegments,
    };

    if (filter) {
      Object.assign(params, {
        FilterExpression: filter.expression,
        ExpressionAttributeNames: filter.expressionNames,
        ExpressionAttributeValues: filter.expressionValues,
      });
    }

    const {
      Items: items,
      ScannedCount: scannedCount,
      LastEvaluatedKey: resultNextToken = null,
    } = await this.client.send(new ScanCommand(params));

    return {
      items: items || [],
      scannedCount,
      nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
    };
  }
}
