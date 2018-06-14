import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class GrokClassifier {
    CustomPatterns?: Value<string>;
    GrokPattern: Value<string>;
    Classification: Value<string>;
    Name?: Value<string>;
    constructor(properties: GrokClassifier);
}
export interface ClassifierProperties {
    GrokClassifier?: GrokClassifier;
}
export default class Classifier extends ResourceBase {
    static GrokClassifier: typeof GrokClassifier;
    constructor(properties?: ClassifierProperties);
}
