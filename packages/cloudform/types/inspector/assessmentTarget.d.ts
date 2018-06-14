import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface AssessmentTargetProperties {
    AssessmentTargetName?: Value<string>;
    ResourceGroupArn: Value<string>;
}
export default class AssessmentTarget extends ResourceBase {
    constructor(properties?: AssessmentTargetProperties);
}
