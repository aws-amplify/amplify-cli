import { TableDescription } from '@aws-sdk/client-dynamodb';

export interface IDynamoDBService {
  listTables(): Promise<string[]>;
  getTableDetails(tableName: string): Promise<TableDescription>;
  tableExists(tableName: string): Promise<boolean>;
}
