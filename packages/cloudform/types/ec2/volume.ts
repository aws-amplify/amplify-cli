/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface VolumeProperties {
    AutoEnableIO?: Value<boolean>
    AvailabilityZone: Value<string>
    Encrypted?: Value<boolean>
    Iops?: Value<number>
    KmsKeyId?: Value<string>
    Size?: Value<number>
    SnapshotId?: Value<string>
    Tags?: ResourceTag[]
    VolumeType?: Value<string>
}

export default class Volume extends ResourceBase {


    constructor(properties?: VolumeProperties) {
        super('AWS::EC2::Volume', properties)
    }
}
