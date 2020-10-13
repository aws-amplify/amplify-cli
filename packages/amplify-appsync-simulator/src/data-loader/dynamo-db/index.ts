import { DynamoDB } from 'aws-sdk';
import { unmarshall, nullIfEmpty } from './utils';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { ExpressionAttributeValueMap, TransactWriteItem } from 'aws-sdk/clients/dynamodb';
import {
  AppSyncConditionCheckTransactionWriteItems,
  AppSyncDeleteItemTransactionWriteItems,
  AppSyncPutItemTransactionWriteItems,
  AppSyncTransactionWriteItem,
  AppSyncTransactionWriteItemsOperation,
  AppSyncTransactionWriteItemsOperationResponse,
  AppSyncUpdateItemTransactionWriteItems,
} from './AppSyncTransactionWriteItems';

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

  private transformExpressionAttributeValues(
    expressions: ExpressionAttributeValueMap | null | undefined,
  ): ExpressionAttributeValueMap | null | undefined {
    if (typeof expressions !== 'object') {
      return expressions;
    }
    const attributes: ExpressionAttributeValueMap[] = [];
    attributes.push(expressions);

    while (attributes.length > 0) {
      const attr = attributes.shift();
      Object.keys(attr).forEach(key => {
        const value = attr[key];
        if (value.M) {
          attributes.push(value.M);
        }
        if (value.N) {
          value.N = `${value.N}`;
        }
        if (value.NS) {
          value.NS = value.NS.map(item => `${item}`);
        }
      });
    }
    return expressions;
  }

  private transformPutTransationWriteItem(transactItem: AppSyncPutItemTransactionWriteItems): TransactWriteItem {
    return {
      Put: {
        TableName: transactItem.table,
        Item: transactItem.attributeValues,
        ConditionExpression: transactItem.condition?.expression,
        ExpressionAttributeNames: transactItem.condition?.expressionNames,
        ExpressionAttributeValues: this.transformExpressionAttributeValues(transactItem.condition?.expressionValues),
        ReturnValuesOnConditionCheckFailure: transactItem.condition?.returnValuesOnConditionCheckFailure ? 'ALL_OLD' : 'NONE',
      },
    };
  }

  private transformUpdateTransationWriteItem(transactItem: AppSyncUpdateItemTransactionWriteItems): TransactWriteItem {
    return {
      Update: {
        Key: transactItem.key,
        TableName: transactItem.table,
        UpdateExpression: transactItem.update.expression,
        ConditionExpression: transactItem.condition?.expression,
        ExpressionAttributeNames:
          transactItem.update.expressionNames || transactItem.condition?.expressionNames
            ? {
                ...(transactItem.update.expressionNames || {}),
                ...(transactItem.condition.expressionNames || {}),
              }
            : undefined,
        ExpressionAttributeValues:
          transactItem.update.expressionValues || transactItem.condition?.expressionValues
            ? this.transformExpressionAttributeValues({
                ...(transactItem.update.expressionValues || {}),
                ...(transactItem.condition.expressionValues || {}),
              })
            : undefined,
        ReturnValuesOnConditionCheckFailure: transactItem.condition?.returnValuesOnConditionCheckFailure ? 'ALL_OLD' : 'NONE',
      },
    };
  }

  private transformDeleteTransationWriteItem(transactItem: AppSyncDeleteItemTransactionWriteItems): TransactWriteItem {
    return {
      Delete: {
        Key: transactItem.key,
        TableName: transactItem.table,
        ConditionExpression: transactItem.condition?.expression,
        ExpressionAttributeNames: transactItem.condition?.expressionNames,
        ExpressionAttributeValues: this.transformExpressionAttributeValues(transactItem.condition?.expressionValues),
        ReturnValuesOnConditionCheckFailure: transactItem.condition?.returnValuesOnConditionCheckFailure ? 'ALL_OLD' : 'NONE',
      },
    };
  }

  private transformCheckConditionTransationWriteItem(transactItem: AppSyncConditionCheckTransactionWriteItems): TransactWriteItem {
    return {
      ConditionCheck: {
        Key: transactItem.key,
        TableName: transactItem.table,
        ConditionExpression: transactItem.condition?.expression,
        ExpressionAttributeNames: transactItem.condition?.expressionNames,
        ExpressionAttributeValues: this.transformExpressionAttributeValues(transactItem.condition?.expressionValues),
        ReturnValuesOnConditionCheckFailure: transactItem.condition?.returnValuesOnConditionCheckFailure ? 'ALL_OLD' : 'NONE',
      },
    };
  }

  private async transactWriteItems({
    transactItems,
  }: AppSyncTransactionWriteItemsOperation): Promise<AppSyncTransactionWriteItemsOperationResponse> {
    const keys = transactItems.map(({ key }) => key);

    const transactionMap = (transactItem: AppSyncTransactionWriteItem): TransactWriteItem => {
      switch (transactItem.operation) {
        case 'PutItem':
          return this.transformPutTransationWriteItem(transactItem);
        case 'UpdateItem':
          return this.transformUpdateTransationWriteItem(transactItem);
        case 'DeleteItem':
          return this.transformDeleteTransationWriteItem(transactItem);
        case 'ConditionCheck':
          return this.transformCheckConditionTransationWriteItem(transactItem);

        default:
          return transactItem;
      }
    };

    const transactionItemsMapped = transactItems.map(transactionMap);

    const request = this.client.transactWriteItems({
      TransactItems: transactionItemsMapped,
    });

    return new Promise((resolve, reject) => {
      request.on('extractError', resp => {
        try {
          const errors = JSON.parse(resp.httpResponse.body.toString());
          resolve({
            keys: null,
            cancellationReasons: errors.CancellationReasons,
          });
        } catch (e) {
          reject(resp.httpResponse.body.toString());
        }
      });

      request.on('extractData', response => {
        resolve({
          keys,
          cancellationReasons: null,
        });
      });

      request.on('error', error => {
        console.log('[on error]', error);
        reject(error);
      });

      request.send();
    });
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
}
