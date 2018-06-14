import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class TemplateInner {
    HtmlPart?: Value<string>;
    TextPart?: Value<string>;
    TemplateName?: Value<string>;
    SubjectPart?: Value<string>;
    constructor(properties: TemplateInner);
}
export interface TemplateProperties {
    Template?: Template;
}
export default class Template extends ResourceBase {
    static Template: typeof TemplateInner;
    constructor(properties?: TemplateProperties);
}
