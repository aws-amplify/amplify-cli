/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SecurityGroupProperties {
    Description: Value<string>
}

export default class SecurityGroup extends ResourceBase {


    constructor(properties?: SecurityGroupProperties) {
        super('AWS::ElastiCache::SecurityGroup', properties)
    }
}
