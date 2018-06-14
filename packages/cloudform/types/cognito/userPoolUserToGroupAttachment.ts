/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface UserPoolUserToGroupAttachmentProperties {
    GroupName: Value<string>
    UserPoolId: Value<string>
    Username: Value<string>
}

export default class UserPoolUserToGroupAttachment extends ResourceBase {


    constructor(properties?: UserPoolUserToGroupAttachmentProperties) {
        super('AWS::Cognito::UserPoolUserToGroupAttachment', properties)
    }
}
