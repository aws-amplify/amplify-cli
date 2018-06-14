/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ModelProperties {
    ContentType?: Value<string>
    Description?: Value<string>
    Name?: Value<string>
    RestApiId: Value<string>
    Schema?: any
}

export default class Model extends ResourceBase {


    constructor(properties?: ModelProperties) {
        super('AWS::ApiGateway::Model', properties)
    }
}
