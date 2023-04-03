import { $TSContext, INotificationsResource, IPluginAPIResponse } from '@aws-amplify/amplify-cli-core';
export declare const notificationsPluginAPIGetResource: (context: $TSContext) => Promise<INotificationsResource | undefined>;
export declare const notificationsPluginAPIRemoveApp: (context: $TSContext, appName: string) => Promise<IPluginAPIResponse | undefined>;
export declare const notificationsAPIRemoveApp: (context: $TSContext) => Promise<$TSContext>;
export declare const notificationsAPIGetAvailableChannelNames: () => Promise<string[]>;
//# sourceMappingURL=plugin-provider-api-notifications.d.ts.map