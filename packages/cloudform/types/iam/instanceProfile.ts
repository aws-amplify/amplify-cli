/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface InstanceProfileProperties {
    InstanceProfileName?: Value<string>
    Path?: Value<string>
    Roles: List<Value<string>>
}

export default class InstanceProfile extends ResourceBase {


    constructor(properties?: InstanceProfileProperties) {
        super('AWS::IAM::InstanceProfile', properties)
    }
}
