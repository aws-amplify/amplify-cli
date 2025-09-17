import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, nullIfEmpty } from './utils';
import { AmplifyAppSyncSimulatorDataLoader } from '..';

type DynamoDBConnectionConfig = {
  endpoint: string;
  region: 'us-fake-1';
  accessKeyId: 'fake';
  secretAccessKey: 'fake';
  tableName: string;
};
type DynamoDBLoaderConfig = {
  config: DynamoDBConnectionConfig;
  options: object;
};
export class DynamoDBDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(private ddbConfig: DynamoDBLoaderConfig) {
    const { tableName, endpoint } = ddbConfig.config;
    if (!tableName || !endpoint) {
      throw new Error(`Invalid DynamoDBConfig ${JSON.stringify(ddbConfig, null, 4)}`);
    }
    this.tableName = tableName;
    this.client = new DynamoDBClient({ ...ddbConfig.config, ...ddbConfig.options });
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
          new DeleteItemCommand({
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
  private async getAllItems(): Promise<Array<Record<string, AttributeValue>> | null> {
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
      new GetItemCommand({
        TableName: this.tableName,
        Key: payload.key,
        ConsistentRead: consistentRead,
      }),
    );

    if (!result.Item) return null;
    return unmarshall(result.Item);
  }

  private async putItem(payload): Promise<object | null> {
    const {
      key,
      attributeValues,
      condition: {
        // we only provide limited support for condition update expressions.
        expression = null,
        expressionNames = null,
        expressionValues = null,
      } = {},
    } = payload;
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          ...attributeValues,
          ...key,
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
      ExpressionAttributeValues: nullIfEmpty({
        ...(filter.expressionValues || {}),
        ...(keyCondition.expressionValues || {}),
      }),
      ExpressionAttributeNames: nullIfEmpty({
        ...(filter.expressionNames || {}),
        ...(keyCondition.expressionNames || {}),
      }),
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : null,
      IndexName: index,
      Limit: limit,
      ConsistentRead: consistentRead,
      ScanIndexForward: scanIndexForward,
      Select: select || 'ALL_ATTRIBUTES',
    };
    const {
      Items: items,
      ScannedCount: scannedCount,
      LastEvaluatedKey: resultNextToken = null,
    } = await this.client.send(new QueryCommand(params as any));

    return {
      items: items.map((item) => unmarshall(item)),
      scannedCount,
      nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
    };
  }

  private async updateItem(payload) {
    const { key, update = {}, condition = {} } = payload;
    const params: any = {
      TableName: this.tableName,
      Key: key,
      UpdateExpression: update.expression,
      ConditionExpression: condition.expression,
      ReturnValues: 'ALL_NEW',
      ExpressionAttributeNames: nullIfEmpty({
        ...(condition.expressionNames || {}),
        ...(update.expressionNames || {}),
      }),
      ExpressionAttributeValues: nullIfEmpty({
        ...(condition.expressionValues || {}),
        ...(update.expressionValues || {}),
      }),
    };
    const { Attributes: updated } = await this.client.send(new UpdateItemCommand(params));
    return unmarshall(updated);
  }

  private async deleteItem(payload) {
    const {
      key,
      condition: {
        // we only provide limited support for condition update expressions.
        expression = null,
        expressionNames = null,
        expressionValues = null,
      } = {},
    } = payload;
    const { Attributes: deleted } = await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: key,
        ReturnValues: 'ALL_OLD',
        ConditionExpression: expression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      }),
    );

    return unmarshall(deleted);
  }

  private async scan(payload) {
    const { filter, index, limit, consistentRead = false, nextToken, select, totalSegments, segment } = payload;

    const params = {
      TableName: this.tableName,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : null,
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
        ExpressionAttributeNames: nullIfEmpty({
          ...(filter.expressionNames || undefined),
        }),
        ExpressionAttributeValues: {
          ...(filter.expressionValues || undefined),
        },
      });
    }
    const {
      Items: items,
      ScannedCount: scannedCount,
      LastEvaluatedKey: resultNextToken = null,
    } = await this.client.send(new ScanCommand(params));

    return {
      items: items.map((item) => unmarshall(item)),
      scannedCount,
      nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
    };
  }
}
