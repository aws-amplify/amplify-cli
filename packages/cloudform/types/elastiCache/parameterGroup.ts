/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ParameterGroupProperties {
    CacheParameterGroupFamily: Value<string>
    Description: Value<string>
    Properties?: {[key: string]: Value<string>}
}

export default class ParameterGroup extends ResourceBase {


    constructor(properties?: ParameterGroupProperties) {
        super('AWS::ElastiCache::ParameterGroup', properties)
    }
}
