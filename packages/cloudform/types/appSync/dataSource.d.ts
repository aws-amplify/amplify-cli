import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class LambdaConfig {
    LambdaFunctionArn: Value<string>;
    constructor(properties: LambdaConfig);
}
export declare class DynamoDBConfig {
    TableName: Value<string>;
    AwsRegion: Value<string>;
    UseCallerCredentials?: Value<boolean>;
    constructor(properties: DynamoDBConfig);
}
export declare class ElasticsearchConfig {
    AwsRegion: Value<string>;
    Endpoint: Value<string>;
    constructor(properties: ElasticsearchConfig);
}
export interface DataSourceProperties {
    Type: Value<string>;
    Description?: Value<string>;
    ServiceRoleArn?: Value<string>;
    LambdaConfig?: LambdaConfig;
    ApiId: Value<string>;
    Name: Value<string>;
    DynamoDBConfig?: DynamoDBConfig;
    ElasticsearchConfig?: ElasticsearchConfig;
}
export default class DataSource extends ResourceBase {
    static LambdaConfig: typeof LambdaConfig;
    static DynamoDBConfig: typeof DynamoDBConfig;
    static ElasticsearchConfig: typeof ElasticsearchConfig;
    constructor(properties?: DataSourceProperties);
}
