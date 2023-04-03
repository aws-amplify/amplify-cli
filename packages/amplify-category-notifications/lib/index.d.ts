import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
export { notificationsPluginAPIGetResource, notificationsPluginAPIRemoveApp, notificationsAPIGetAvailableChannelNames, } from './plugin-provider-api-notifications';
export declare const console: (context: $TSContext) => Promise<void>;
export declare const deletePinpointAppForEnv: (context: $TSContext, envName: string) => Promise<void>;
export declare const initEnv: (context: $TSContext) => Promise<void>;
export declare const migrate: (context: $TSContext) => Promise<void>;
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<void>;
export declare const handleAmplifyEvent: (__context: $TSContext, args: $TSAny) => void;
//# sourceMappingURL=index.d.ts.map