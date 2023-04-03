import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { IPinpointAppStatus } from './pinpoint-helper';
export declare const initEnv: (context: $TSContext) => Promise<$TSAny>;
export declare const deletePinpointAppForEnv: (context: $TSContext, envName: string) => Promise<$TSAny>;
export declare const checkAndCreatePinpointApp: (context: $TSContext, channelName: string, pinpointAppStatus: IPinpointAppStatus) => Promise<IPinpointAppStatus>;
export declare const migrate: (context: $TSContext) => Promise<void>;
//# sourceMappingURL=multi-env-manager.d.ts.map