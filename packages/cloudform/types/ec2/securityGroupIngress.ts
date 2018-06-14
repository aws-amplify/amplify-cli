/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SecurityGroupIngressProperties {
    CidrIp?: Value<string>
    CidrIpv6?: Value<string>
    Description?: Value<string>
    FromPort?: Value<number>
    GroupId?: Value<string>
    GroupName?: Value<string>
    IpProtocol: Value<string>
    SourceSecurityGroupId?: Value<string>
    SourceSecurityGroupName?: Value<string>
    SourceSecurityGroupOwnerId?: Value<string>
    ToPort?: Value<number>
}

export default class SecurityGroupIngress extends ResourceBase {


    constructor(properties?: SecurityGroupIngressProperties) {
        super('AWS::EC2::SecurityGroupIngress', properties)
    }
}
