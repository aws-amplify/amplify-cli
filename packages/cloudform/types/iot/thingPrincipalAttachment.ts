/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ThingPrincipalAttachmentProperties {
    Principal: Value<string>
    ThingName: Value<string>
}

export default class ThingPrincipalAttachment extends ResourceBase {


    constructor(properties?: ThingPrincipalAttachmentProperties) {
        super('AWS::IoT::ThingPrincipalAttachment', properties)
    }
}
