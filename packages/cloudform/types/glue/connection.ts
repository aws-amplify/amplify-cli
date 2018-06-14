/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ConnectionInput {
    Description?: Value<string>
    ConnectionType: Value<string>
    MatchCriteria?: List<Value<string>>
    PhysicalConnectionRequirements?: PhysicalConnectionRequirements
    ConnectionProperties: any
    Name?: Value<string>

    constructor(properties: ConnectionInput) {
        Object.assign(this, properties)
    }
}

export class PhysicalConnectionRequirements {
    AvailabilityZone?: Value<string>
    SecurityGroupIdList?: List<Value<string>>
    SubnetId?: Value<string>

    constructor(properties: PhysicalConnectionRequirements) {
        Object.assign(this, properties)
    }
}

export interface ConnectionProperties {
    ConnectionInput: ConnectionInput
    CatalogId: Value<string>
}

export default class Connection extends ResourceBase {
    static ConnectionInput = ConnectionInput
    static PhysicalConnectionRequirements = PhysicalConnectionRequirements

    constructor(properties?: ConnectionProperties) {
        super('AWS::Glue::Connection', properties)
    }
}
