/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBClusterParameterGroupProperties {
    Description: Value<string>
    Family: Value<string>
    Parameters: any
    Tags?: ResourceTag[]
}

export default class DBClusterParameterGroup extends ResourceBase {


    constructor(properties?: DBClusterParameterGroupProperties) {
        super('AWS::RDS::DBClusterParameterGroup', properties)
    }
}
