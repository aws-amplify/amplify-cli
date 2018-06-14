/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface EventSubscriptionProperties {
    SourceType?: Value<string>
    EventCategories?: List<Value<string>>
    Enabled?: Value<boolean>
    SubscriptionName?: Value<string>
    SnsTopicArn: Value<string>
    SourceIds?: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class EventSubscription extends ResourceBase {


    constructor(properties?: EventSubscriptionProperties) {
        super('AWS::DMS::EventSubscription', properties)
    }
}
