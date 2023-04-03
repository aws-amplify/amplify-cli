import { $TSContext } from 'amplify-cli-core';
export declare function forceRemoveResource(context: $TSContext, category: string, resourceName: string, resourceDir: string): Promise<any>;
export declare function removeResource(context: $TSContext, category: string, resourceName?: string, options?: {
    headless?: boolean;
    serviceSuffix?: {
        [serviceName: string]: string;
    };
    serviceDeletionInfo?: {
        [serviceName: string]: string;
    };
}, resourceNameCallback?: (resourceName: string) => Promise<void>): Promise<{
    service: string;
    resourceName: string;
} | undefined>;
//# sourceMappingURL=remove-resource.d.ts.map