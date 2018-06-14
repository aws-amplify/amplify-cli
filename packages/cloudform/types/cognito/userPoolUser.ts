/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class AttributeType {
    Value?: Value<string>
    Name?: Value<string>

    constructor(properties: AttributeType) {
        Object.assign(this, properties)
    }
}

export interface UserPoolUserProperties {
    ValidationData?: List<AttributeType>
    UserPoolId: Value<string>
    Username?: Value<string>
    MessageAction?: Value<string>
    DesiredDeliveryMediums?: List<Value<string>>
    ForceAliasCreation?: Value<boolean>
    UserAttributes?: List<AttributeType>
}

export default class UserPoolUser extends ResourceBase {
    static AttributeType = AttributeType

    constructor(properties?: UserPoolUserProperties) {
        super('AWS::Cognito::UserPoolUser', properties)
    }
}
