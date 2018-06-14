/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DocumentProperties {
    Content: any
    DocumentType?: Value<string>
    Tags?: ResourceTag[]
}

export default class Document extends ResourceBase {


    constructor(properties?: DocumentProperties) {
        super('AWS::SSM::Document', properties)
    }
}
