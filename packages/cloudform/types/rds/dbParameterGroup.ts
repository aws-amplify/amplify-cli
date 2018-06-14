/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBParameterGroupProperties {
    Description: Value<string>
    Family: Value<string>
    Parameters?: {[key: string]: Value<string>}
    Tags?: ResourceTag[]
}

export default class DBParameterGroup extends ResourceBase {


    constructor(properties?: DBParameterGroupProperties) {
        super('AWS::RDS::DBParameterGroup', properties)
    }
}
