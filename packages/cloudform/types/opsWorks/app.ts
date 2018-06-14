/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class DataSource {
    Arn?: Value<string>
    DatabaseName?: Value<string>
    Type?: Value<string>

    constructor(properties: DataSource) {
        Object.assign(this, properties)
    }
}

export class EnvironmentVariable {
    Key: Value<string>
    Secure?: Value<boolean>
    Value: Value<string>

    constructor(properties: EnvironmentVariable) {
        Object.assign(this, properties)
    }
}

export class SslConfiguration {
    Certificate?: Value<string>
    Chain?: Value<string>
    PrivateKey?: Value<string>

    constructor(properties: SslConfiguration) {
        Object.assign(this, properties)
    }
}

export class Source {
    Password?: Value<string>
    Revision?: Value<string>
    SshKey?: Value<string>
    Type?: Value<string>
    Url?: Value<string>
    Username?: Value<string>

    constructor(properties: Source) {
        Object.assign(this, properties)
    }
}

export interface AppProperties {
    AppSource?: Source
    Attributes?: {[key: string]: Value<string>}
    DataSources?: List<DataSource>
    Description?: Value<string>
    Domains?: List<Value<string>>
    EnableSsl?: Value<boolean>
    Environment?: List<EnvironmentVariable>
    Name: Value<string>
    Shortname?: Value<string>
    SslConfiguration?: SslConfiguration
    StackId: Value<string>
    Type: Value<string>
}

export default class App extends ResourceBase {
    static DataSource = DataSource
    static EnvironmentVariable = EnvironmentVariable
    static SslConfiguration = SslConfiguration
    static Source = Source

    constructor(properties?: AppProperties) {
        super('AWS::OpsWorks::App', properties)
    }
}
