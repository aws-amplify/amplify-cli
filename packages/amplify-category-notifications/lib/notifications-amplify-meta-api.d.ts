import { $TSAny, $TSMeta, $TSContext, INotificationsResourceMeta } from '@aws-amplify/amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
export declare const toggleNotificationsChannelAppMeta: (channelName: string, isEnabled: boolean, amplifyMeta?: $TSMeta, appName?: string) => Promise<$TSMeta>;
export declare const getNotificationsAppMeta: (amplifyMeta?: $TSMeta, appName?: string) => Promise<INotificationsResourceMeta | undefined>;
export declare const removeNotificationsAppMeta: (context: $TSContext) => Promise<$TSContext>;
export declare const checkMigratedFromMobileHub: (amplifyMeta?: $TSMeta) => Promise<boolean>;
export declare const checkMigratedFromMobileHubLegacy: (amplifyMeta?: $TSMeta) => Promise<boolean>;
export declare const isNotificationChannelEnabled: (notificationsResourceMeta: INotificationsResourceMeta, channelName: string) => boolean;
export declare const getEnabledChannelsFromAppMeta: (amplifyMeta?: $TSAny) => Promise<Array<string>>;
export declare const getDisabledChannelsFromAmplifyMeta: (amplifyMeta?: $TSMeta) => Promise<Array<string>>;
export declare const getPinpointRegionMapping: (context: $TSContext) => Promise<string | undefined>;
export declare const addPartialNotificationsAppMeta: (context: $TSContext, notificationResourceName: string) => Promise<$TSMeta>;
export declare const constructPartialNotificationsAppMeta: (amplifyMeta: $TSMeta, resourceName: string, pinpointRegion: string | undefined) => Partial<ICategoryMeta>;
export declare const constructResourceMeta: (amplifyMeta: $TSMeta, resourceName: string, pinpointOutput: Partial<ICategoryMeta>) => Partial<ICategoryMeta>;
//# sourceMappingURL=notifications-amplify-meta-api.d.ts.map