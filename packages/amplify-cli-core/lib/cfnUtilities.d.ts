import { Template } from 'cloudform-types';
declare const defaultReadCFNTemplateOptions: {
    throwIfNotExist: boolean;
};
export declare function readCFNTemplate(filePath: string): {
    templateFormat: CFNTemplateFormat;
    cfnTemplate: Template;
};
export declare function readCFNTemplate(filePath: string, options: Partial<typeof defaultReadCFNTemplateOptions>): {
    templateFormat: CFNTemplateFormat;
    cfnTemplate: Template;
} | undefined;
export declare enum CFNTemplateFormat {
    JSON = "json",
    YAML = "yaml"
}
export type WriteCFNTemplateOptions = {
    templateFormat?: CFNTemplateFormat;
    minify?: boolean;
};
export declare const writeCFNTemplate: (template: object, filePath: string, options?: WriteCFNTemplateOptions) => Promise<void>;
export {};
//# sourceMappingURL=cfnUtilities.d.ts.map