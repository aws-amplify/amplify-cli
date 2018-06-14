import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class OpenIDConnectConfig {
    Issuer?: Value<string>;
    ClientId?: Value<string>;
    AuthTTL?: Value<number>;
    IatTTL?: Value<number>;
    constructor(properties: OpenIDConnectConfig);
}
export declare class LogConfig {
    CloudWatchLogsRoleArn?: Value<string>;
    FieldLogLevel?: Value<string>;
    constructor(properties: LogConfig);
}
export declare class UserPoolConfig {
    AppIdClientRegex?: Value<string>;
    UserPoolId?: Value<string>;
    AwsRegion?: Value<string>;
    DefaultAction?: Value<string>;
    constructor(properties: UserPoolConfig);
}
export interface GraphQLApiProperties {
    OpenIDConnectConfig?: OpenIDConnectConfig;
    UserPoolConfig?: UserPoolConfig;
    Name: Value<string>;
    AuthenticationType: Value<string>;
    LogConfig?: LogConfig;
}
export default class GraphQLApi extends ResourceBase {
    static OpenIDConnectConfig: typeof OpenIDConnectConfig;
    static LogConfig: typeof LogConfig;
    static UserPoolConfig: typeof UserPoolConfig;
    constructor(properties?: GraphQLApiProperties);
}
