/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VolumeAttachmentProperties {
    Device: Value<string>
    InstanceId: Value<string>
    VolumeId: Value<string>
}

export default class VolumeAttachment extends ResourceBase {


    constructor(properties?: VolumeAttachmentProperties) {
        super('AWS::EC2::VolumeAttachment', properties)
    }
}
