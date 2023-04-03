import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { IChannelAPIResponse } from './channel-types';
export declare const configure: (context: $TSContext) => Promise<IChannelAPIResponse>;
export declare const enable: (context: $TSContext) => Promise<IChannelAPIResponse>;
export declare const disable: (context: $TSContext) => Promise<IChannelAPIResponse>;
export declare const pull: (__context: $TSContext, pinpointApp: $TSAny) => Promise<$TSAny>;
//# sourceMappingURL=channel-in-app-msg.d.ts.map