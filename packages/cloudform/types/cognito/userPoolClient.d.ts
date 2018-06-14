import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface UserPoolClientProperties {
    GenerateSecret?: Value<boolean>;
    ClientName?: Value<string>;
    UserPoolId: Value<string>;
    ExplicitAuthFlows?: List<Value<string>>;
    RefreshTokenValidity?: Value<number>;
    ReadAttributes?: List<Value<string>>;
    WriteAttributes?: List<Value<string>>;
}
export default class UserPoolClient extends ResourceBase {
    constructor(properties?: UserPoolClientProperties);
}
