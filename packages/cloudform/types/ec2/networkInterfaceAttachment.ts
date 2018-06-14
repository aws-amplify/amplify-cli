/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface NetworkInterfaceAttachmentProperties {
    DeleteOnTermination?: Value<boolean>
    DeviceIndex: Value<string>
    InstanceId: Value<string>
    NetworkInterfaceId: Value<string>
}

export default class NetworkInterfaceAttachment extends ResourceBase {


    constructor(properties?: NetworkInterfaceAttachmentProperties) {
        super('AWS::EC2::NetworkInterfaceAttachment', properties)
    }
}
