/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class GrokClassifier {
    CustomPatterns?: Value<string>
    GrokPattern: Value<string>
    Classification: Value<string>
    Name?: Value<string>

    constructor(properties: GrokClassifier) {
        Object.assign(this, properties)
    }
}

export interface ClassifierProperties {
    GrokClassifier?: GrokClassifier
}

export default class Classifier extends ResourceBase {
    static GrokClassifier = GrokClassifier

    constructor(properties?: ClassifierProperties) {
        super('AWS::Glue::Classifier', properties)
    }
}
