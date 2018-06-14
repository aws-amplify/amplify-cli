/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Ingress {
    CIDRIP?: Value<string>
    EC2SecurityGroupId?: Value<string>
    EC2SecurityGroupName?: Value<string>
    EC2SecurityGroupOwnerId?: Value<string>

    constructor(properties: Ingress) {
        Object.assign(this, properties)
    }
}

export interface DBSecurityGroupProperties {
    DBSecurityGroupIngress: List<Ingress>
    EC2VpcId?: Value<string>
    GroupDescription: Value<string>
    Tags?: ResourceTag[]
}

export default class DBSecurityGroup extends ResourceBase {
    static Ingress = Ingress

    constructor(properties?: DBSecurityGroupProperties) {
        super('AWS::RDS::DBSecurityGroup', properties)
    }
}
