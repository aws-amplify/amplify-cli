/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class StageKey {
    RestApiId?: Value<string>
    StageName?: Value<string>

    constructor(properties: StageKey) {
        Object.assign(this, properties)
    }
}

export interface ApiKeyProperties {
    CustomerId?: Value<string>
    Description?: Value<string>
    Enabled?: Value<boolean>
    GenerateDistinctId?: Value<boolean>
    Name?: Value<string>
    StageKeys?: List<StageKey>
}

export default class ApiKey extends ResourceBase {
    static StageKey = StageKey

    constructor(properties?: ApiKeyProperties) {
        super('AWS::ApiGateway::ApiKey', properties)
    }
}
