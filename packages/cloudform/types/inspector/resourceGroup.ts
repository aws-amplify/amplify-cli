/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface ResourceGroupProperties {
    ResourceGroupTags: List<ResourceTag>
}

export default class ResourceGroup extends ResourceBase {


    constructor(properties?: ResourceGroupProperties) {
        super('AWS::Inspector::ResourceGroup', properties)
    }
}
