/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface KeyProperties {
    Description?: Value<string>
    EnableKeyRotation?: Value<boolean>
    Enabled?: Value<boolean>
    KeyPolicy: any
    KeyUsage?: Value<string>
    Tags?: ResourceTag[]
}

export default class Key extends ResourceBase {


    constructor(properties?: KeyProperties) {
        super('AWS::KMS::Key', properties)
    }
}
