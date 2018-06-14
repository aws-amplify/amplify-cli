/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ElasticLoadBalancerAttachmentProperties {
    ElasticLoadBalancerName: Value<string>
    LayerId: Value<string>
}

export default class ElasticLoadBalancerAttachment extends ResourceBase {


    constructor(properties?: ElasticLoadBalancerAttachmentProperties) {
        super('AWS::OpsWorks::ElasticLoadBalancerAttachment', properties)
    }
}
