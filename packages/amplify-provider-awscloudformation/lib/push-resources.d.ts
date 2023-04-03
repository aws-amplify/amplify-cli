import glob from 'glob';
import { $TSAny, $TSContext, $TSObject, $TSMeta, Template } from 'amplify-cli-core';
export declare const defaultRootStackFileName = "rootStackTemplate.json";
export declare const rootStackFileName = "root-cloudformation-stack.json";
export declare const run: (context: $TSContext, resourceDefinition: $TSObject, rebuild?: boolean) => Promise<void>;
export declare const updateStackForAPIMigration: (context: $TSContext, category: string, resourceName: string, options: $TSAny) => Promise<void>;
export declare const getCfnFiles: (category: string, resourceName: string, includeAllNestedStacks?: boolean, options?: glob.IOptions) => {
    resourceDir: string;
    cfnFiles: string[];
};
export declare const uploadTemplateToS3: (context: $TSContext, filePath: string, category: string, resourceName: string, amplifyMeta: $TSMeta) => Promise<void>;
export declare const formNestedStack: (context: $TSContext, projectDetails: $TSObject, categoryName?: string, resourceName?: string, serviceName?: string, skipEnv?: boolean, useExistingMeta?: boolean) => Promise<Template>;
export declare const generateAndUploadRootStack: (context: $TSContext, destinationPath: string, destinationS3Key: string) => Promise<void>;
//# sourceMappingURL=push-resources.d.ts.map