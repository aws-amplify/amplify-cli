import { TableDescription, TableName } from 'aws-sdk/clients/dynamodb';
export interface IDynamoDBService {
    listTables(): Promise<TableName[]>;
    getTableDetails(tableName: string): Promise<TableDescription>;
    tableExists(tableName: string): Promise<boolean>;
}
//# sourceMappingURL=IDynamoDBService.d.ts.map