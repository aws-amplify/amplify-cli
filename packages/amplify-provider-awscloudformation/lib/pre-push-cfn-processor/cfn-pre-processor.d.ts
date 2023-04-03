export declare const preProcessCFNTemplate: (filePath: string, options?: {
    minify?: boolean;
}) => Promise<string>;
export declare const writeCustomPoliciesToCFNTemplate: (resourceName: string, service: string, cfnFile: string, category: string, options?: {
    minify?: boolean;
}) => Promise<void>;
//# sourceMappingURL=cfn-pre-processor.d.ts.map