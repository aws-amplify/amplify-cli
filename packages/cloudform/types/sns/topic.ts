/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Subscription {
    Endpoint: Value<string>
    Protocol: Value<string>

    constructor(properties: Subscription) {
        Object.assign(this, properties)
    }
}

export interface TopicProperties {
    DisplayName?: Value<string>
    Subscription?: List<Subscription>
    TopicName?: Value<string>
}

export default class Topic extends ResourceBase {
    static Subscription = Subscription

    constructor(properties?: TopicProperties) {
        super('AWS::SNS::Topic', properties)
    }
}
