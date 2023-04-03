import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { INotificationsResourceBackendConfig } from './notifications-backend-cfg-types';
export declare const getNotificationsAppConfig: (backendConfig?: $TSAny) => Promise<INotificationsResourceBackendConfig | undefined>;
export declare const getCurrentNotificationsAppConfig: (currentBackendConfig?: $TSAny) => Promise<INotificationsResourceBackendConfig | undefined>;
export declare const isNotificationsResourceCreatedInBackendConfig: (resourceBackendConfig: INotificationsResourceBackendConfig) => boolean;
export declare const addPartialNotificationsBackendConfig: (pinpointResourceName: string, backendConfig?: $TSAny) => Promise<$TSAny>;
export declare const removeNotificationsAppConfig: (context: $TSContext) => Promise<$TSContext>;
//# sourceMappingURL=notifications-backend-cfg-api.d.ts.map