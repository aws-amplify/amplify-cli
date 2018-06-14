/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface DocumentationVersionProperties {
    Description?: Value<string>
    DocumentationVersion: Value<string>
    RestApiId: Value<string>
}

export default class DocumentationVersion extends ResourceBase {


    constructor(properties?: DocumentationVersionProperties) {
        super('AWS::ApiGateway::DocumentationVersion', properties)
    }
}
