import { $TSAny, $TSContext } from 'amplify-cli-core';
export declare function prePushTemplateDescriptionHandler(context: $TSContext, resourcesToBeCreated: $TSAny): Promise<void>;
export declare function setDefaultTemplateDescription(context: $TSContext, category: string, resourceName: string, service: string, cfnFilePath: string): Promise<void>;
export declare function getDefaultTemplateDescription(context: $TSContext, category: string, service?: string): string;
//# sourceMappingURL=template-description-utils.d.ts.map