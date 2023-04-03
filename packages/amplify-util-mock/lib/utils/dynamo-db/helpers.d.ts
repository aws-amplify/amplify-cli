import { DynamoDB } from 'aws-sdk';
export declare function waitTillTableStateIsActive(dynamoDBClient: DynamoDB, tableName: string, maximumWait?: number): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map