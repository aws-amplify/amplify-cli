/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBSubnetGroupProperties {
    DBSubnetGroupDescription: Value<string>
    DBSubnetGroupName?: Value<string>
    SubnetIds: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class DBSubnetGroup extends ResourceBase {


    constructor(properties?: DBSubnetGroupProperties) {
        super('AWS::RDS::DBSubnetGroup', properties)
    }
}
