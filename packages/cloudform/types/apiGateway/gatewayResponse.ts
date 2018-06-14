/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface GatewayResponseProperties {
    ResponseParameters?: {[key: string]: Value<string>}
    ResponseTemplates?: {[key: string]: Value<string>}
    ResponseType: Value<string>
    RestApiId: Value<string>
    StatusCode?: Value<string>
}

export default class GatewayResponse extends ResourceBase {


    constructor(properties?: GatewayResponseProperties) {
        super('AWS::ApiGateway::GatewayResponse', properties)
    }
}
