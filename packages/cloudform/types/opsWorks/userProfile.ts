/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface UserProfileProperties {
    AllowSelfManagement?: Value<boolean>
    IamUserArn: Value<string>
    SshPublicKey?: Value<string>
    SshUsername?: Value<string>
}

export default class UserProfile extends ResourceBase {


    constructor(properties?: UserProfileProperties) {
        super('AWS::OpsWorks::UserProfile', properties)
    }
}
