/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VolumeProperties {
    Ec2VolumeId: Value<string>
    MountPoint?: Value<string>
    Name?: Value<string>
    StackId: Value<string>
}

export default class Volume extends ResourceBase {


    constructor(properties?: VolumeProperties) {
        super('AWS::OpsWorks::Volume', properties)
    }
}
