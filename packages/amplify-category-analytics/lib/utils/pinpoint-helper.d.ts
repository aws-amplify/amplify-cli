import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
export type PinpointApp = {
    appId: string;
    appName: string;
};
export declare const pinpointInAppMessagingPolicyName = "pinpointInAppMessagingPolicyName";
export declare const console: (context: $TSContext) => Promise<void>;
export declare const hasResource: (context: $TSContext) => boolean;
export declare const pinpointHasInAppMessagingPolicy: (context: $TSContext) => boolean;
export declare const getNotificationsCategoryHasPinpointIfExists: () => PinpointApp | undefined;
export declare const getPinpointRegionMappings: (context: $TSContext) => Promise<Record<string, $TSAny>>;
//# sourceMappingURL=pinpoint-helper.d.ts.map