import { DynamoDB } from 'aws-sdk';
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
  private client: DynamoDB;
  private tableName: string;

  constructor(private ddbConfig: DynamoDBLoaderConfig) {
    const { tableName, endpoint } = ddbConfig.config;
    if (!tableName || !endpoint) {
      throw new Error(`Invalid DynamoDBConfig ${JSON.stringify(ddbConfig, null, 4)}`);
    }
    this.tableName = tableName;
    this.client = new DynamoDB({ ...ddbConfig.config, ...ddbConfig.options });
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

        case 'BatchGetItem':
        case 'BatchPutItem':
        case 'BatchDeleteItem':
          throw new Error(`Operation  ${payload.operation} not implemented`);
        default:
          throw new Error(`Unknown operation name: ${payload.operation}`);
      }
    } catch (e) {
      if (e.code) {
        console.log('Error while executing Local DynamoDB');
        console.log(JSON.stringify(payload, null, 4));
        console.log(e);
        e.extensions = { errorType: 'DynamoDB:' + e.code };
      }
      throw e;
    }
  }

  private async getItem(payload: any): Promise<object | null> {
    const { consistentRead = false } = payload;
    const result = await this.client
      .getItem({
        TableName: this.tableName,
        Key: payload.key,
        ConsistentRead: consistentRead,
      })
      .promise();

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
    await this.client
      .putItem({
        TableName: this.tableName,
        Item: {
          ...attributeValues,
          ...key,
        },
        ConditionExpression: expression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      })
      .promise();

    // put does not return us anything useful so we need to fetch the object.

    return this.getItem({ key, consistentRead: true });
  }
  private async query({
    query: keyCondition,
    filter,
    index,
    nextToken,
    limit,
    scanIndexForward = true,
    consistentRead = false,
    select,
  }) {
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
    } = await this.client.query(params as any).promise();

    return {
      items: items.map(item => unmarshall(item)),
      scannedCount,
      nextToken: resultNextToken
        ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64')
        : null,
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
      ExpressionAttributeNames: {
        ...(condition.expressionNames || {}),
        ...update.expressionNames,
      },
      ExpressionAttributeValues: {
        ...(condition.expressionValues || {}),
        ...update.expressionValues,
      },
    };

    const { Attributes: updated } = await this.client.updateItem(params).promise();
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
    const { Attributes: deleted } = await this.client
      .deleteItem({
        TableName: this.tableName,
        Key: key,
        ReturnValues: 'ALL_OLD',
        ConditionExpression: expression,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      })
      .promise();

    return unmarshall(deleted);
  }
  private async scan(payload) {
    const {
      filter,
      index,
      limit,
      consistentRead = false,
      nextToken,
      select,
      totalSegments,
      segment,
    } = payload;

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
    } = await this.client.scan(params).promise();

    return {
      items: items.map(item => unmarshall(item)),
      scannedCount,
      nextToken: resultNextToken
        ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64')
        : null,
    };
  }
}
