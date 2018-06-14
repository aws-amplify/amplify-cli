/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DHCPOptionsProperties {
    DomainName?: Value<string>
    DomainNameServers?: List<Value<string>>
    NetbiosNameServers?: List<Value<string>>
    NetbiosNodeType?: Value<number>
    NtpServers?: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class DHCPOptions extends ResourceBase {


    constructor(properties?: DHCPOptionsProperties) {
        super('AWS::EC2::DHCPOptions', properties)
    }
}
