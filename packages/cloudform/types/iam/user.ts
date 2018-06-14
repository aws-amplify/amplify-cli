/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class LoginProfile {
    Password: Value<string>
    PasswordResetRequired?: Value<boolean>

    constructor(properties: LoginProfile) {
        Object.assign(this, properties)
    }
}

export class Policy {
    PolicyDocument: any
    PolicyName: Value<string>

    constructor(properties: Policy) {
        Object.assign(this, properties)
    }
}

export interface UserProperties {
    Groups?: List<Value<string>>
    LoginProfile?: LoginProfile
    ManagedPolicyArns?: List<Value<string>>
    Path?: Value<string>
    Policies?: List<Policy>
    UserName?: Value<string>
}

export default class User extends ResourceBase {
    static LoginProfile = LoginProfile
    static Policy = Policy

    constructor(properties?: UserProperties) {
        super('AWS::IAM::User', properties)
    }
}
