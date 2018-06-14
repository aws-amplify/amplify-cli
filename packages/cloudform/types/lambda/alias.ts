/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class AliasRoutingConfiguration {
    AdditionalVersionWeights: List<VersionWeight>

    constructor(properties: AliasRoutingConfiguration) {
        Object.assign(this, properties)
    }
}

export class VersionWeight {
    FunctionVersion: Value<string>
    FunctionWeight: Value<number>

    constructor(properties: VersionWeight) {
        Object.assign(this, properties)
    }
}

export interface AliasProperties {
    Description?: Value<string>
    FunctionName: Value<string>
    FunctionVersion: Value<string>
    Name: Value<string>
    RoutingConfig?: AliasRoutingConfiguration
}

export default class Alias extends ResourceBase {
    static AliasRoutingConfiguration = AliasRoutingConfiguration
    static VersionWeight = VersionWeight

    constructor(properties?: AliasProperties) {
        super('AWS::Lambda::Alias', properties)
    }
}
