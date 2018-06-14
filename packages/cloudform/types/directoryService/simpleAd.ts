/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class VpcSettings {
    SubnetIds: List<Value<string>>
    VpcId: Value<string>

    constructor(properties: VpcSettings) {
        Object.assign(this, properties)
    }
}

export interface SimpleADProperties {
    CreateAlias?: Value<boolean>
    Description?: Value<string>
    EnableSso?: Value<boolean>
    Name: Value<string>
    Password: Value<string>
    ShortName?: Value<string>
    Size: Value<string>
    VpcSettings: VpcSettings
}

export default class SimpleAD extends ResourceBase {
    static VpcSettings = VpcSettings

    constructor(properties?: SimpleADProperties) {
        super('AWS::DirectoryService::SimpleAD', properties)
    }
}
