import Resource from 'cloudform-types/types/resource';
import { Template } from 'cloudform-types';
export type TemplateModifier = (template: Template) => Promise<void>;
export type ResourceModifier<T extends Resource> = (resource: T) => Promise<T>;
export declare const prePushCfnTemplateModifier: TemplateModifier;
//# sourceMappingURL=pre-push-cfn-modifier.d.ts.map