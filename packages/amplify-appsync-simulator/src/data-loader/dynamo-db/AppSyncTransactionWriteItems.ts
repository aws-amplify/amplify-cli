import {
  ConditionExpression,
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
  Key,
  PutItemInputAttributeMap,
  UpdateExpression,
} from 'aws-sdk/clients/dynamodb';

export interface AppSyncPutItemTransactionWriteItems {
  table: string;
  operation: 'PutItem';
  key: Key;
  attributeValues: PutItemInputAttributeMap;
  condition?: {
    expression: ConditionExpression;
    expressionNames?: ExpressionAttributeNameMap;
    expressionValues?: ExpressionAttributeValueMap;
    returnValuesOnConditionCheckFailure?: true | false;
  };
}

export interface AppSyncUpdateItemTransactionWriteItems {
  table: string;
  operation: 'UpdateItem';
  key: Key;
  update: {
    expression: string;
    expressionNames?: ExpressionAttributeNameMap;
    expressionValues?: ExpressionAttributeValueMap;
  };
  condition?: {
    expression: ConditionExpression;
    expressionNames?: ExpressionAttributeNameMap;
    expressionValues?: ExpressionAttributeValueMap;
    returnValuesOnConditionCheckFailure?: true | false;
  };
}

export interface AppSyncDeleteItemTransactionWriteItems {
  table: 'table3';
  operation: 'DeleteItem';
  key: Key;
  condition?: {
    expression: ConditionExpression;
    expressionNames?: ExpressionAttributeNameMap;
    expressionValues?: ExpressionAttributeValueMap;
    returnValuesOnConditionCheckFailure?: true | false;
  };
}

export interface AppSyncConditionCheckTransactionWriteItems {
  table: 'table4';
  operation: 'ConditionCheck';
  key: Key;
  condition: {
    expression: ConditionExpression;
    expressionNames?: ExpressionAttributeNameMap;
    expressionValues?: ExpressionAttributeValueMap;
    returnValuesOnConditionCheckFailure?: true | false;
  };
}

export type AppSyncTransactionWriteItem =
  | AppSyncPutItemTransactionWriteItems
  | AppSyncUpdateItemTransactionWriteItems
  | AppSyncDeleteItemTransactionWriteItems
  | AppSyncConditionCheckTransactionWriteItems;
export type AppSyncTransactionWriteItems = AppSyncTransactionWriteItem[];

export interface AppSyncTransactionWriteItemsOperation {
  version: '2018-05-29';
  operation: 'TransactWriteItems';
  transactItems: AppSyncTransactionWriteItems;
}

export interface AppSyncTransactionWriteItemsCancellationReasons {
  item?: PutItemInputAttributeMap;
  type: string;
  message: string;
}

export interface AppSyncTransactionWriteItemsOperationResponse {
  keys: Key[] | null;
  cancellationReasons: AppSyncTransactionWriteItemsCancellationReasons[] | null;
}
