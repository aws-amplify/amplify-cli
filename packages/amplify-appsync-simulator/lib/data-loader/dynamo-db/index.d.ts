import { AmplifyAppSyncSimulatorDataLoader } from '..';
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
export declare class DynamoDBDataLoader implements AmplifyAppSyncSimulatorDataLoader {
    private ddbConfig;
    private client;
    private tableName;
    constructor(ddbConfig: DynamoDBLoaderConfig);
    load(payload: any): Promise<object | null>;
    private deleteAllItems;
    private getAllItems;
    private getItem;
    private putItem;
    private query;
    private updateItem;
    private deleteItem;
    private scan;
}
export {};
//# sourceMappingURL=index.d.ts.map