/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface NetworkInterfacePermissionProperties {
    AwsAccountId: Value<string>
    NetworkInterfaceId: Value<string>
    Permission: Value<string>
}

export default class NetworkInterfacePermission extends ResourceBase {


    constructor(properties?: NetworkInterfacePermissionProperties) {
        super('AWS::EC2::NetworkInterfacePermission', properties)
    }
}
