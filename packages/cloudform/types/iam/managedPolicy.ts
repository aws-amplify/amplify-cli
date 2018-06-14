/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ManagedPolicyProperties {
    Description?: Value<string>
    Groups?: List<Value<string>>
    ManagedPolicyName?: Value<string>
    Path?: Value<string>
    PolicyDocument: any
    Roles?: List<Value<string>>
    Users?: List<Value<string>>
}

export default class ManagedPolicy extends ResourceBase {


    constructor(properties?: ManagedPolicyProperties) {
        super('AWS::IAM::ManagedPolicy', properties)
    }
}
