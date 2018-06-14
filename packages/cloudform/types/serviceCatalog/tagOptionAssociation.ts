/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface TagOptionAssociationProperties {
    TagOptionId: Value<string>
    ResourceId: Value<string>
}

export default class TagOptionAssociation extends ResourceBase {


    constructor(properties?: TagOptionAssociationProperties) {
        super('AWS::ServiceCatalog::TagOptionAssociation', properties)
    }
}
