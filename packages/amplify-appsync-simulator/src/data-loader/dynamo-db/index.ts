import { DynamoDB } from 'aws-sdk';
import { unmarshall, nullIfEmpty } from './utils';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import {
  TransactWriteItemList,
  TransactWriteItem,
  ExpressionAttributeValueMap,
  ExpressionAttributeNameMap,
} from 'aws-sdk/clients/dynamodb';
import { QueryDocumentKeys } from 'graphql/language/visitor';

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
        case 'TransactWriteItems':
          return await this.transactWriteItems(payload);
        case 'BatchGetItem':
          return await this.batchGetItem(payload);
        case 'BatchPutItem':
          return await this.batchPutItem(payload);
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
    const { Items: items, ScannedCount: scannedCount, LastEvaluatedKey: resultNextToken = null } = await this.client
      .query(params as any)
      .promise();

    return {
      items: items.map(item => unmarshall(item)),
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
      ExpressionAttributeNames:
        condition?.expressionNames || update.expressionNames
          ? {
              ...(condition.expressionNames || {}),
              ...update.expressionNames,
            }
          : undefined,
      ExpressionAttributeValues:
        condition?.expressionValues || update.expressionValues
          ? {
              ...(condition.expressionValues || {}),
              ...update.expressionValues,
            }
          : undefined,
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
    const { Items: items, ScannedCount: scannedCount, LastEvaluatedKey: resultNextToken = null } = await this.client.scan(params).promise();

    return {
      items: items.map(item => unmarshall(item)),
      scannedCount,
      nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
    };
  }

  private async transactWriteItems({
    transactItems,
  }: {
    transactItems: (TransactOperationPutItem | TransactOperationUpdateItem | TransactOperationDeleteItem)[];
  }) {
    const TransactItems: TransactWriteItemList = transactItems.map(
      (item): TransactWriteItem => {
        switch (item.operation) {
          case 'PutItem':
            return {
              Put: {
                TableName: item.table,
                Item: {
                  ...item.key,
                  ...item.attributeValues,
                },
                ConditionExpression: item.condition?.expression,
                ExpressionAttributeValues: item.condition?.expressionValues,
                ExpressionAttributeNames: item.condition?.expressionNames,
              },
            };
          case 'UpdateItem':
            return {
              Update: {
                TableName: item.table,
                Key: item.key,
                UpdateExpression: item.update.expression,
                ConditionExpression: item.condition?.expression,
                ExpressionAttributeValues:
                  item.condition?.expressionValues || item.update.expressionValues
                    ? {
                        ...(item.update || {}).expressionValues,
                        ...(item.condition || {}).expressionValues,
                      }
                    : undefined,
                ExpressionAttributeNames:
                  item.condition?.expressionNames || item.update.expressionNames
                    ? {
                        ...(item.update || {}).expressionNames,
                        ...(item.condition || {}).expressionNames,
                      }
                    : undefined,
              },
            };
          case 'DeleteItem':
            return {
              Delete: {
                TableName: item.table,
                Key: item.key,
                ConditionExpression: item.condition?.expression,
                ExpressionAttributeValues: item.condition?.expressionValues,
                ExpressionAttributeNames: item.condition?.expressionNames,
              },
            };
        }
      },
    );
    await this.client.transactWriteItems({ TransactItems }).promise();
    return { keys: transactItems.map(item => DynamoDB.Converter.unmarshall(item.key)) };
  }

  private async batchGetItem({ tables }: { tables: { [key: string]: { keys: DynamoDB.Key[] } } }) {
    tables;
    const input: DynamoDB.Types.BatchGetItemInput = {
      RequestItems: {},
    };
    for (const tableName of Object.keys(tables)) {
      input.RequestItems[tableName] = { Keys: tables[tableName].keys };
    }
    const res = await this.client.batchGetItem(input).promise();
    const result = {
      data: {},
      unprocessedKeys: {},
    };
    if (res.Responses) {
      for (const tableName of Object.keys(res.Responses)) {
        const hoge = res.Responses[tableName];
        result.data[tableName] = res.Responses[tableName].map(item => DynamoDB.Converter.unmarshall(item));
      }
    }
    if (res.UnprocessedKeys) {
      for (const tableName of Object.keys(res.UnprocessedKeys)) {
        result.unprocessedKeys[tableName] = res.UnprocessedKeys[tableName].Keys.map(key => DynamoDB.Converter.unmarshall(key));
      }
    }
    return result;
  }

  private async batchPutItem({ tables }: { tables: { [key: string]: DynamoDB.AttributeMap[] } }) {
    const input: DynamoDB.Types.BatchWriteItemInput = {
      RequestItems: {},
    };
    for (const tableName of Object.keys(tables)) {
      input.RequestItems[tableName] = tables[tableName].map(Item => {
        return { PutRequest: { Item } };
      });
    }
    const res = await this.client.batchWriteItem(input).promise();
    const result = {
      data: {},
      unprocessedItems: {},
    };
    if (res.ItemCollectionMetrics) {
      for (const tableName of Object.keys(res.ItemCollectionMetrics)) {
        result.data[tableName] = res.ItemCollectionMetrics[tableName].map(item => DynamoDB.Converter.unmarshall(item.ItemCollectionKey));
      }
    }
    if (res.UnprocessedItems) {
      for (const tableName of Object.keys(res.UnprocessedItems)) {
        result.unprocessedItems[tableName] = res.UnprocessedItems[tableName].map(req =>
          DynamoDB.Converter.unmarshall(req.PutRequest?.Item),
        );
      }
    }
    return result;
  }
}

interface TransactOperationPutItem {
  table: string;
  operation: 'PutItem';
  key: DynamoDB.Key;
  attributeValues: ExpressionAttributeValueMap;
  condition?: {
    expression: string;
    expressionValues?: ExpressionAttributeValueMap;
    expressionNames?: ExpressionAttributeNameMap;
  };
}

interface TransactOperationUpdateItem {
  table: string;
  operation: 'UpdateItem';
  key: DynamoDB.Key;
  update: {
    expression: string;
    expressionValues?: ExpressionAttributeValueMap;
    expressionNames?: ExpressionAttributeNameMap;
  };
  condition?: {
    expression: string;
    expressionValues?: ExpressionAttributeValueMap;
    expressionNames?: ExpressionAttributeNameMap;
  };
}

interface TransactOperationDeleteItem {
  table: string;
  operation: 'DeleteItem';
  key: DynamoDB.Key;
  condition?: {
    expression: string;
    expressionValues?: ExpressionAttributeValueMap;
    expressionNames?: ExpressionAttributeNameMap;
  };
}
