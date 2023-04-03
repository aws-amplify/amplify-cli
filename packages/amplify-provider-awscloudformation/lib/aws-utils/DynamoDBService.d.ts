import { $TSAny, $TSContext } from 'amplify-cli-core';
import { IDynamoDBService } from '@aws-amplify/amplify-util-import';
import DynamoDB, { TableDescription, TableName } from 'aws-sdk/clients/dynamodb';
export declare const createDynamoDBService: (context: $TSContext, options: $TSAny) => Promise<DynamoDBService>;
export declare class DynamoDBService implements IDynamoDBService {
    private dynamoDB;
    private cachedTableList;
    constructor(dynamoDB: DynamoDB);
    listTables(): Promise<TableName[]>;
    getTableDetails(tableName: string): Promise<TableDescription>;
    tableExists(tableName: string): Promise<boolean>;
}
//# sourceMappingURL=DynamoDBService.d.ts.map