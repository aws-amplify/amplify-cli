/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class IpPermission {
    FromPort: Value<number>
    IpRange: Value<string>
    Protocol: Value<string>
    ToPort: Value<number>

    constructor(properties: IpPermission) {
        Object.assign(this, properties)
    }
}

export interface FleetProperties {
    BuildId: Value<string>
    Description?: Value<string>
    DesiredEC2Instances: Value<number>
    EC2InboundPermissions?: List<IpPermission>
    EC2InstanceType: Value<string>
    LogPaths?: List<Value<string>>
    MaxSize?: Value<number>
    MinSize?: Value<number>
    Name: Value<string>
    ServerLaunchParameters?: Value<string>
    ServerLaunchPath: Value<string>
}

export default class Fleet extends ResourceBase {
    static IpPermission = IpPermission

    constructor(properties?: FleetProperties) {
        super('AWS::GameLift::Fleet', properties)
    }
}
