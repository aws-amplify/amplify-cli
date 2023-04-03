import { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
export type MockDynamoDBConfig = {
    tables: {
        Properties: CreateTableInput;
        isNewlyAdded: boolean;
    }[];
};
export declare function createAndUpdateTable(dynamoDbClient: DynamoDB, config: MockDynamoDBConfig): Promise<MockDynamoDBConfig>;
export declare function configureDDBDataSource(config: any, ddbConfig: any): any;
//# sourceMappingURL=index.d.ts.map