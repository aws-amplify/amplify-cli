/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Action {
    TargetGroupArn: Value<string>
    Type: Value<string>

    constructor(properties: Action) {
        Object.assign(this, properties)
    }
}

export class Certificate {
    CertificateArn?: Value<string>

    constructor(properties: Certificate) {
        Object.assign(this, properties)
    }
}

export interface ListenerProperties {
    Certificates?: List<Certificate>
    DefaultActions: List<Action>
    LoadBalancerArn: Value<string>
    Port: Value<number>
    Protocol: Value<string>
    SslPolicy?: Value<string>
}

export default class Listener extends ResourceBase {
    static Action = Action
    static Certificate = Certificate

    constructor(properties?: ListenerProperties) {
        super('AWS::ElasticLoadBalancingV2::Listener', properties)
    }
}
