import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { IChannelAPIResponse } from './channel-types';
export declare const enableChannel: (context: $TSContext, channelName: string) => Promise<IChannelAPIResponse | undefined>;
export declare const disableChannel: (context: $TSContext, channelName: string) => Promise<IChannelAPIResponse | undefined>;
export declare const disableAllChannels: (context: $TSContext) => Promise<Array<IChannelAPIResponse>>;
export declare const removeEmptyNotificationsApp: (context: $TSContext) => Promise<$TSContext>;
export declare const configureChannel: (context: $TSContext, channelName: string) => Promise<IChannelAPIResponse | undefined>;
export declare const pullAllChannels: (context: $TSContext, pinpointApp: $TSAny) => Promise<Array<IChannelAPIResponse>>;
//# sourceMappingURL=notifications-manager.d.ts.map