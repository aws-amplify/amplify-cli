import { DynamoDB } from 'aws-sdk';
import { CreateTableInput, TableDescription, UpdateTableInput } from 'aws-sdk/clients/dynamodb';
export declare function createTables(dynamoDbClient: DynamoDB, tables: CreateTableInput[]): Promise<void>;
export declare function updateTables(dynamoDbClient: DynamoDB, tables: UpdateTableInput[]): Promise<void>;
export declare function describeTables(dynamoDbClient: DynamoDB, tableNames: string[]): Promise<Record<string, TableDescription>>;
export declare function getUpdateTableInput(createInput: CreateTableInput, existingTableConfig: TableDescription): UpdateTableInput[];
//# sourceMappingURL=utils.d.ts.map