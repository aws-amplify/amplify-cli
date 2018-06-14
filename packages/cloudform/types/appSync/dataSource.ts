/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class LambdaConfig {
    LambdaFunctionArn: Value<string>

    constructor(properties: LambdaConfig) {
        Object.assign(this, properties)
    }
}

export class DynamoDBConfig {
    TableName: Value<string>
    AwsRegion: Value<string>
    UseCallerCredentials?: Value<boolean>

    constructor(properties: DynamoDBConfig) {
        Object.assign(this, properties)
    }
}

export class ElasticsearchConfig {
    AwsRegion: Value<string>
    Endpoint: Value<string>

    constructor(properties: ElasticsearchConfig) {
        Object.assign(this, properties)
    }
}

export interface DataSourceProperties {
    Type: Value<string>
    Description?: Value<string>
    ServiceRoleArn?: Value<string>
    LambdaConfig?: LambdaConfig
    ApiId: Value<string>
    Name: Value<string>
    DynamoDBConfig?: DynamoDBConfig
    ElasticsearchConfig?: ElasticsearchConfig
}

export default class DataSource extends ResourceBase {
    static LambdaConfig = LambdaConfig
    static DynamoDBConfig = DynamoDBConfig
    static ElasticsearchConfig = ElasticsearchConfig

    constructor(properties?: DataSourceProperties) {
        super('AWS::AppSync::DataSource', properties)
    }
}
