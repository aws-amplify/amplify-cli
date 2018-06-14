import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface AssessmentTemplateProperties {
    AssessmentTargetArn: Value<string>;
    DurationInSeconds: Value<number>;
    AssessmentTemplateName?: Value<string>;
    RulesPackageArns: List<Value<string>>;
    UserAttributesForFindings?: List<ResourceTag>;
}
export default class AssessmentTemplate extends ResourceBase {
    constructor(properties?: AssessmentTemplateProperties);
}
