import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class MethodResponse {
    ResponseModels?: {
        [key: string]: Value<string>;
    };
    ResponseParameters?: {
        [key: string]: Value<boolean>;
    };
    StatusCode: Value<string>;
    constructor(properties: MethodResponse);
}
export declare class Integration {
    CacheKeyParameters?: List<Value<string>>;
    CacheNamespace?: Value<string>;
    ContentHandling?: Value<string>;
    Credentials?: Value<string>;
    IntegrationHttpMethod?: Value<string>;
    IntegrationResponses?: List<IntegrationResponse>;
    PassthroughBehavior?: Value<string>;
    RequestParameters?: {
        [key: string]: Value<string>;
    };
    RequestTemplates?: {
        [key: string]: Value<string>;
    };
    Type?: Value<string>;
    Uri?: Value<string>;
    constructor(properties: Integration);
}
export declare class IntegrationResponse {
    ContentHandling?: Value<string>;
    ResponseParameters?: {
        [key: string]: Value<string>;
    };
    ResponseTemplates?: {
        [key: string]: Value<string>;
    };
    SelectionPattern?: Value<string>;
    StatusCode: Value<string>;
    constructor(properties: IntegrationResponse);
}
export interface MethodProperties {
    ApiKeyRequired?: Value<boolean>;
    AuthorizationType?: Value<string>;
    AuthorizerId?: Value<string>;
    HttpMethod: Value<string>;
    Integration?: Integration;
    MethodResponses?: List<MethodResponse>;
    OperationName?: Value<string>;
    RequestModels?: {
        [key: string]: Value<string>;
    };
    RequestParameters?: {
        [key: string]: Value<boolean>;
    };
    RequestValidatorId?: Value<string>;
    ResourceId: Value<string>;
    RestApiId: Value<string>;
}
export default class Method extends ResourceBase {
    static MethodResponse: typeof MethodResponse;
    static Integration: typeof Integration;
    static IntegrationResponse: typeof IntegrationResponse;
    constructor(properties?: MethodProperties);
}
