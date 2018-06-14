/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBClusterParameterGroupProperties {
    Description: Value<string>
    Parameters: any
    Family: Value<string>
    Tags?: ResourceTag[]
    Name?: Value<string>
}

export default class DBClusterParameterGroup extends ResourceBase {


    constructor(properties?: DBClusterParameterGroupProperties) {
        super('AWS::Neptune::DBClusterParameterGroup', properties)
    }
}
