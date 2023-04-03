import { $TSAny, $TSContext, INotificationsResourceMeta } from '@aws-amplify/amplify-cli-core';
import { IChannelAPIResponse, INotificationsConfigStatus } from './channel-types';
export declare const generateMetaFromConfig: (envName: string, cfg: $TSAny) => Partial<INotificationsResourceMeta>;
export declare const updateChannelAPIResponse: (context: $TSContext, channelAPIResponse: IChannelAPIResponse) => Promise<$TSContext>;
export declare const getNotificationConfigStatus: (context: $TSContext) => Promise<INotificationsConfigStatus | undefined>;
//# sourceMappingURL=notifications-api.d.ts.map