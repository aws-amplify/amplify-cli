/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PermissionProperties {
    Action: Value<string>
    EventSourceToken?: Value<string>
    FunctionName: Value<string>
    Principal: Value<string>
    SourceAccount?: Value<string>
    SourceArn?: Value<string>
}

export default class Permission extends ResourceBase {


    constructor(properties?: PermissionProperties) {
        super('AWS::Lambda::Permission', properties)
    }
}
