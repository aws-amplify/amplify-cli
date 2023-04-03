import { $TSAny, $TSMeta, $TSObject, ResourceTuple } from 'amplify-cli-core';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';
export declare const updateAwsMetaFile: (filePath: string, category: string, resourceName: string, attribute: $TSAny, value: $TSAny, timestamp: $TSAny) => $TSMeta;
export declare const updateamplifyMetaAfterResourceAdd: (category: string, resourceName: string, metadataResource?: {
    dependsOn?: [{
        category: string;
        resourceName: string;
    }] | undefined;
}, backendConfigResource?: {
    dependsOn?: $TSAny;
} | undefined, overwriteObjectIfExists?: boolean | undefined) => void;
export declare const updateProviderAmplifyMeta: (providerName: string, options: $TSObject) => void;
export declare const updateamplifyMetaAfterResourceUpdate: (category: string, resourceName: string, attribute: string, value: $TSAny) => $TSMeta;
export declare const updateamplifyMetaAfterPush: (resources: $TSObject[]) => Promise<void>;
export declare const updateamplifyMetaAfterBuild: ({ category, resourceName }: ResourceTuple, buildType?: BuildType) => void;
export declare const updateAmplifyMetaAfterPackage: ({ category, resourceName }: ResourceTuple, zipFilename: string, hash?: {
    resourceKey: string;
    hashValue: string;
} | undefined) => void;
export declare const updateamplifyMetaAfterResourceDelete: (category: string, resourceName: string) => void;
//# sourceMappingURL=update-amplify-meta.d.ts.map