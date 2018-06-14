/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface RequestValidatorProperties {
    Name?: Value<string>
    RestApiId: Value<string>
    ValidateRequestBody?: Value<boolean>
    ValidateRequestParameters?: Value<boolean>
}

export default class RequestValidator extends ResourceBase {


    constructor(properties?: RequestValidatorProperties) {
        super('AWS::ApiGateway::RequestValidator', properties)
    }
}
