/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class OpenIDConnectConfig {
    Issuer?: Value<string>
    ClientId?: Value<string>
    AuthTTL?: Value<number>
    IatTTL?: Value<number>

    constructor(properties: OpenIDConnectConfig) {
        Object.assign(this, properties)
    }
}

export class LogConfig {
    CloudWatchLogsRoleArn?: Value<string>
    FieldLogLevel?: Value<string>

    constructor(properties: LogConfig) {
        Object.assign(this, properties)
    }
}

export class UserPoolConfig {
    AppIdClientRegex?: Value<string>
    UserPoolId?: Value<string>
    AwsRegion?: Value<string>
    DefaultAction?: Value<string>

    constructor(properties: UserPoolConfig) {
        Object.assign(this, properties)
    }
}

export interface GraphQLApiProperties {
    OpenIDConnectConfig?: OpenIDConnectConfig
    UserPoolConfig?: UserPoolConfig
    Name: Value<string>
    AuthenticationType: Value<string>
    LogConfig?: LogConfig
}

export default class GraphQLApi extends ResourceBase {
    static OpenIDConnectConfig = OpenIDConnectConfig
    static LogConfig = LogConfig
    static UserPoolConfig = UserPoolConfig

    constructor(properties?: GraphQLApiProperties) {
        super('AWS::AppSync::GraphQLApi', properties)
    }
}
