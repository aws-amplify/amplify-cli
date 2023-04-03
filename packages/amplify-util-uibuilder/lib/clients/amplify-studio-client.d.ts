import { $TSContext } from '@aws-amplify/amplify-cli-core';
import type { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import type { CreateComponentData, Component, Theme, Form } from 'aws-sdk/clients/amplifyuibuilder';
export type StudioMetadata = {
    autoGenerateForms: boolean;
    autoGenerateViews: boolean;
};
export default class AmplifyStudioClient {
    #private;
    metadata: StudioMetadata;
    isGraphQLSupported: boolean;
    static isAmplifyApp: (context: $TSContext, appId: string) => Promise<boolean>;
    static setClientInfo(context: $TSContext, envName?: string, appId?: string): Promise<AmplifyStudioClient>;
    constructor(awsConfigInfo: ServiceConfigurationOptions, appId: string, envName: string);
    loadMetadata: (envName?: string, appId?: string) => Promise<void>;
    listComponents: (envName?: string, appId?: string) => Promise<{
        entities: Component[];
    }>;
    listThemes: (envName?: string, appId?: string) => Promise<{
        entities: Theme[];
    }>;
    listForms: (envName?: string, appId?: string) => Promise<{
        entities: Form[];
    }>;
    createComponent: (component: CreateComponentData, envName?: string, appId?: string) => Promise<Component | undefined>;
    deleteForm: (formId: string, envName?: string, appId?: string) => Promise<void>;
    getModels: (resourceName: string, envName?: string, appId?: string) => Promise<string | undefined>;
}
//# sourceMappingURL=amplify-studio-client.d.ts.map