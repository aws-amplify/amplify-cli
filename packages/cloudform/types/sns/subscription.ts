/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface SubscriptionProperties {
    Endpoint?: Value<string>
    Protocol?: Value<string>
    TopicArn?: Value<string>
}

export default class Subscription extends ResourceBase {


    constructor(properties?: SubscriptionProperties) {
        super('AWS::SNS::Subscription', properties)
    }
}
