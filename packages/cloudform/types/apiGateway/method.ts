/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class MethodResponse {
    ResponseModels?: {[key: string]: Value<string>}
    ResponseParameters?: {[key: string]: Value<boolean>}
    StatusCode: Value<string>

    constructor(properties: MethodResponse) {
        Object.assign(this, properties)
    }
}

export class Integration {
    CacheKeyParameters?: List<Value<string>>
    CacheNamespace?: Value<string>
    ContentHandling?: Value<string>
    Credentials?: Value<string>
    IntegrationHttpMethod?: Value<string>
    IntegrationResponses?: List<IntegrationResponse>
    PassthroughBehavior?: Value<string>
    RequestParameters?: {[key: string]: Value<string>}
    RequestTemplates?: {[key: string]: Value<string>}
    Type?: Value<string>
    Uri?: Value<string>

    constructor(properties: Integration) {
        Object.assign(this, properties)
    }
}

export class IntegrationResponse {
    ContentHandling?: Value<string>
    ResponseParameters?: {[key: string]: Value<string>}
    ResponseTemplates?: {[key: string]: Value<string>}
    SelectionPattern?: Value<string>
    StatusCode: Value<string>

    constructor(properties: IntegrationResponse) {
        Object.assign(this, properties)
    }
}

export interface MethodProperties {
    ApiKeyRequired?: Value<boolean>
    AuthorizationType?: Value<string>
    AuthorizerId?: Value<string>
    HttpMethod: Value<string>
    Integration?: Integration
    MethodResponses?: List<MethodResponse>
    OperationName?: Value<string>
    RequestModels?: {[key: string]: Value<string>}
    RequestParameters?: {[key: string]: Value<boolean>}
    RequestValidatorId?: Value<string>
    ResourceId: Value<string>
    RestApiId: Value<string>
}

export default class Method extends ResourceBase {
    static MethodResponse = MethodResponse
    static Integration = Integration
    static IntegrationResponse = IntegrationResponse

    constructor(properties?: MethodProperties) {
        super('AWS::ApiGateway::Method', properties)
    }
}
