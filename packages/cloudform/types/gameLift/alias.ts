/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class RoutingStrategy {
    FleetId?: Value<string>
    Message?: Value<string>
    Type: Value<string>

    constructor(properties: RoutingStrategy) {
        Object.assign(this, properties)
    }
}

export interface AliasProperties {
    Description?: Value<string>
    Name: Value<string>
    RoutingStrategy: RoutingStrategy
}

export default class Alias extends ResourceBase {
    static RoutingStrategy = RoutingStrategy

    constructor(properties?: AliasProperties) {
        super('AWS::GameLift::Alias', properties)
    }
}
