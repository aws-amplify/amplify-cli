import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { IChannelAPIResponse } from './channel-types';
export declare const configure: (context: $TSContext) => Promise<void>;
export declare const enable: (context: $TSContext, successMessage: string | undefined) => Promise<IChannelAPIResponse>;
export declare const disable: (context: $TSContext) => Promise<$TSAny>;
export declare const pull: (context: $TSContext, pinpointApp: $TSAny) => Promise<$TSAny>;
//# sourceMappingURL=channel-fcm.d.ts.map