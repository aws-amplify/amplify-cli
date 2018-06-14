/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Parameter {
    ParameterName: Value<string>
    ParameterValue: Value<string>

    constructor(properties: Parameter) {
        Object.assign(this, properties)
    }
}

export interface ClusterParameterGroupProperties {
    Description: Value<string>
    ParameterGroupFamily: Value<string>
    Parameters?: List<Parameter>
    Tags?: ResourceTag[]
}

export default class ClusterParameterGroup extends ResourceBase {
    static Parameter = Parameter

    constructor(properties?: ClusterParameterGroupProperties) {
        super('AWS::Redshift::ClusterParameterGroup', properties)
    }
}
