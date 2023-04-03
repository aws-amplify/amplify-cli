import { $TSContext, ProviderContext } from '@aws-amplify/amplify-cli-core';
import { TemplateMappings } from '../service-stacks/baseStack';
import { ServiceName } from '../service-utils/constants';
export declare const addResource: (context: $TSContext, service: string) => Promise<string | undefined>;
export declare const updateResource: (context: $TSContext, service: string) => Promise<string>;
export declare const removeResource: (context: $TSContext, service: string) => Promise<string | undefined>;
export declare const projectHasAuth: () => boolean;
export declare const printNextStepsSuccessMessage: () => void;
export declare const setProviderContext: (context: $TSContext, service: string) => ProviderContext;
export declare const openConsole: (service: string) => Promise<void>;
export declare const insufficientInfoForUpdateError: (service: ServiceName) => Error;
export declare const getTemplateMappings: (context: $TSContext) => Promise<TemplateMappings>;
export declare const addResourceHeadless: (context: $TSContext, headlessPayload: string) => Promise<string | undefined>;
export declare const updateResourceHeadless: (context: $TSContext, headlessPayload: string) => Promise<string | undefined>;
//# sourceMappingURL=index.d.ts.map