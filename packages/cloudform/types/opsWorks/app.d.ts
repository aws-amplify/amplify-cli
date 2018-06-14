import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class DataSource {
    Arn?: Value<string>;
    DatabaseName?: Value<string>;
    Type?: Value<string>;
    constructor(properties: DataSource);
}
export declare class EnvironmentVariable {
    Key: Value<string>;
    Secure?: Value<boolean>;
    Value: Value<string>;
    constructor(properties: EnvironmentVariable);
}
export declare class SslConfiguration {
    Certificate?: Value<string>;
    Chain?: Value<string>;
    PrivateKey?: Value<string>;
    constructor(properties: SslConfiguration);
}
export declare class Source {
    Password?: Value<string>;
    Revision?: Value<string>;
    SshKey?: Value<string>;
    Type?: Value<string>;
    Url?: Value<string>;
    Username?: Value<string>;
    constructor(properties: Source);
}
export interface AppProperties {
    AppSource?: Source;
    Attributes?: {
        [key: string]: Value<string>;
    };
    DataSources?: List<DataSource>;
    Description?: Value<string>;
    Domains?: List<Value<string>>;
    EnableSsl?: Value<boolean>;
    Environment?: List<EnvironmentVariable>;
    Name: Value<string>;
    Shortname?: Value<string>;
    SslConfiguration?: SslConfiguration;
    StackId: Value<string>;
    Type: Value<string>;
}
export default class App extends ResourceBase {
    static DataSource: typeof DataSource;
    static EnvironmentVariable: typeof EnvironmentVariable;
    static SslConfiguration: typeof SslConfiguration;
    static Source: typeof Source;
    constructor(properties?: AppProperties);
}
