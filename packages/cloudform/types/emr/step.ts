/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class HadoopJarStepConfig {
    Args?: List<Value<string>>
    Jar: Value<string>
    MainClass?: Value<string>
    StepProperties?: List<KeyValue>

    constructor(properties: HadoopJarStepConfig) {
        Object.assign(this, properties)
    }
}

export class KeyValue {
    Key?: Value<string>
    Value?: Value<string>

    constructor(properties: KeyValue) {
        Object.assign(this, properties)
    }
}

export interface StepProperties {
    ActionOnFailure: Value<string>
    HadoopJarStep: HadoopJarStepConfig
    JobFlowId: Value<string>
    Name: Value<string>
}

export default class Step extends ResourceBase {
    static HadoopJarStepConfig = HadoopJarStepConfig
    static KeyValue = KeyValue

    constructor(properties?: StepProperties) {
        super('AWS::EMR::Step', properties)
    }
}
