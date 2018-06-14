/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SubnetGroupProperties {
    Description?: Value<string>
    SubnetGroupName?: Value<string>
    SubnetIds: List<Value<string>>
}

export default class SubnetGroup extends ResourceBase {


    constructor(properties?: SubnetGroupProperties) {
        super('AWS::DAX::SubnetGroup', properties)
    }
}
