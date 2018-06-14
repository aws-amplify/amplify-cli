import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export declare class S3Settings {
    ExternalTableDefinition?: Value<string>;
    BucketName?: Value<string>;
    BucketFolder?: Value<string>;
    CsvRowDelimiter?: Value<string>;
    CsvDelimiter?: Value<string>;
    ServiceAccessRoleArn?: Value<string>;
    CompressionType?: Value<string>;
    constructor(properties: S3Settings);
}
export declare class MongoDbSettings {
    AuthSource?: Value<string>;
    AuthMechanism?: Value<string>;
    Username?: Value<string>;
    DocsToInvestigate?: Value<string>;
    ServerName?: Value<string>;
    Port?: Value<number>;
    ExtractDocId?: Value<string>;
    DatabaseName?: Value<string>;
    AuthType?: Value<string>;
    Password?: Value<string>;
    NestingLevel?: Value<string>;
    constructor(properties: MongoDbSettings);
}
export declare class DynamoDbSettings {
    ServiceAccessRoleArn?: Value<string>;
    constructor(properties: DynamoDbSettings);
}
export interface EndpointProperties {
    KmsKeyId?: Value<string>;
    Port?: Value<number>;
    DatabaseName?: Value<string>;
    S3Settings?: S3Settings;
    EngineName: Value<string>;
    DynamoDbSettings?: DynamoDbSettings;
    Username?: Value<string>;
    SslMode?: Value<string>;
    ServerName?: Value<string>;
    ExtraConnectionAttributes?: Value<string>;
    EndpointType: Value<string>;
    Tags?: ResourceTag[];
    EndpointIdentifier?: Value<string>;
    Password?: Value<string>;
    CertificateArn?: Value<string>;
    MongoDbSettings?: MongoDbSettings;
}
export default class Endpoint extends ResourceBase {
    static S3Settings: typeof S3Settings;
    static MongoDbSettings: typeof MongoDbSettings;
    static DynamoDbSettings: typeof DynamoDbSettings;
    constructor(properties?: EndpointProperties);
}
