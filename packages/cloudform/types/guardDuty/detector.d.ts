import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface DetectorProperties {
    Enable: Value<boolean>;
}
export default class Detector extends ResourceBase {
    constructor(properties?: DetectorProperties);
}
