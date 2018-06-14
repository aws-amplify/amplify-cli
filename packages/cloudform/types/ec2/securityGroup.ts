/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Ingress {
    CidrIp?: Value<string>
    CidrIpv6?: Value<string>
    Description?: Value<string>
    FromPort?: Value<number>
    IpProtocol: Value<string>
    SourceSecurityGroupId?: Value<string>
    SourceSecurityGroupName?: Value<string>
    SourceSecurityGroupOwnerId?: Value<string>
    ToPort?: Value<number>

    constructor(properties: Ingress) {
        Object.assign(this, properties)
    }
}

export class Egress {
    CidrIp?: Value<string>
    CidrIpv6?: Value<string>
    Description?: Value<string>
    DestinationPrefixListId?: Value<string>
    DestinationSecurityGroupId?: Value<string>
    FromPort?: Value<number>
    IpProtocol: Value<string>
    ToPort?: Value<number>

    constructor(properties: Egress) {
        Object.assign(this, properties)
    }
}

export interface SecurityGroupProperties {
    GroupDescription: Value<string>
    GroupName?: Value<string>
    SecurityGroupEgress?: List<Egress>
    SecurityGroupIngress?: List<Ingress>
    Tags?: ResourceTag[]
    VpcId?: Value<string>
}

export default class SecurityGroup extends ResourceBase {
    static Ingress = Ingress
    static Egress = Egress

    constructor(properties?: SecurityGroupProperties) {
        super('AWS::EC2::SecurityGroup', properties)
    }
}
