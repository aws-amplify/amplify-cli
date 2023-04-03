import { $TSContext, INotificationsResource, IPluginAPIResponse } from '@aws-amplify/amplify-cli-core';
export declare const invokeNotificationsAPIGetResource: (context: $TSContext) => Promise<INotificationsResource | undefined>;
export declare const invokeNotificationsAPIRecursiveRemoveApp: (context: $TSContext, appName: string) => Promise<IPluginAPIResponse>;
export declare const checkResourceInUseByNotifications: (context: $TSContext, resourceName: string) => Promise<boolean>;
export declare const invokeNotificationsAPIGetAvailableChannelNames: (context: $TSContext) => Promise<string[]>;
//# sourceMappingURL=plugin-client-api-notifications.d.ts.map