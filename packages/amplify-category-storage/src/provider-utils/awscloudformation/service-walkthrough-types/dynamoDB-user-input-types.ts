export enum DynamoDBImmutableFields {
  resourceName = 'resourceName',
  tableName = 'tableName',
  partitionKey = 'partitionKey',
  sortKey = 'sortKey',
}

export enum FieldType {
  string = 'string',
  number = 'number',
  binary = 'binary',
  boolean = 'boolean',
  list = 'list',
  map = 'map',
  null = 'null',
}

export interface DynamoDBAttributeDefType {
  AttributeName: string;
  AttributeType: FieldType;
}

export interface DynamoDBCLIInputsKeyType {
  fieldName: string;
  fieldType: FieldType;
}

export interface DynamoDBCLIInputsGSIType {
  name: string;
  partitionKey: DynamoDBCLIInputsKeyType;
  sortKey?: DynamoDBCLIInputsKeyType;
}

export interface DynamoDBCLIInputs {
  resourceName: string;
  tableName: string;
  partitionKey: DynamoDBCLIInputsKeyType;
  sortKey?: DynamoDBCLIInputsKeyType;
  gsi?: DynamoDBCLIInputsGSIType[];
  triggerFunctions?: string[];
}
