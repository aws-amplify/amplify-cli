import { ApiKeyConfig } from '@aws-amplify/graphql-transformer-interfaces';
import { Template } from 'cloudform-types';
import { $TSContext } from '..';
export declare class CloudformationProviderFacade {
    static isAmplifyAdminApp(context: $TSContext, appId: string): Promise<{
        isAdminApp: boolean;
        region: string;
        userPoolID: string;
    }>;
    static hashDirectory(context: $TSContext, directory: string): Promise<string>;
    static prePushCfnTemplateModifier(context: $TSContext, template: Template): Promise<(template: Template) => Promise<void>>;
    static getApiKeyConfig(context: $TSContext): Promise<ApiKeyConfig>;
}
//# sourceMappingURL=cloudformation-provider-facade.d.ts.map