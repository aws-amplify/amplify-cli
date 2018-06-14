/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class S3Settings {
    ExternalTableDefinition?: Value<string>
    BucketName?: Value<string>
    BucketFolder?: Value<string>
    CsvRowDelimiter?: Value<string>
    CsvDelimiter?: Value<string>
    ServiceAccessRoleArn?: Value<string>
    CompressionType?: Value<string>

    constructor(properties: S3Settings) {
        Object.assign(this, properties)
    }
}

export class MongoDbSettings {
    AuthSource?: Value<string>
    AuthMechanism?: Value<string>
    Username?: Value<string>
    DocsToInvestigate?: Value<string>
    ServerName?: Value<string>
    Port?: Value<number>
    ExtractDocId?: Value<string>
    DatabaseName?: Value<string>
    AuthType?: Value<string>
    Password?: Value<string>
    NestingLevel?: Value<string>

    constructor(properties: MongoDbSettings) {
        Object.assign(this, properties)
    }
}

export class DynamoDbSettings {
    ServiceAccessRoleArn?: Value<string>

    constructor(properties: DynamoDbSettings) {
        Object.assign(this, properties)
    }
}

export interface EndpointProperties {
    KmsKeyId?: Value<string>
    Port?: Value<number>
    DatabaseName?: Value<string>
    S3Settings?: S3Settings
    EngineName: Value<string>
    DynamoDbSettings?: DynamoDbSettings
    Username?: Value<string>
    SslMode?: Value<string>
    ServerName?: Value<string>
    ExtraConnectionAttributes?: Value<string>
    EndpointType: Value<string>
    Tags?: ResourceTag[]
    EndpointIdentifier?: Value<string>
    Password?: Value<string>
    CertificateArn?: Value<string>
    MongoDbSettings?: MongoDbSettings
}

export default class Endpoint extends ResourceBase {
    static S3Settings = S3Settings
    static MongoDbSettings = MongoDbSettings
    static DynamoDbSettings = DynamoDbSettings

    constructor(properties?: EndpointProperties) {
        super('AWS::DMS::Endpoint', properties)
    }
}
