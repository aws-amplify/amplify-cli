import { $TSAny, $TSObject, LocalEnvInfo } from './types';
export type EnvironmentInfo = {
    existingLocalEnvInfo?: LocalEnvInfo;
    isNewEnv?: boolean;
    sourceEnvName?: string;
};
export type InputParameters = {
    forcePush?: boolean;
    iterativeRollback?: boolean;
    restoreBackend?: boolean;
};
export type PinpointInfo = {
    pinpointApp?: $TSAny;
    pinpointClient?: $TSAny;
    pinpointInputParams?: $TSAny;
};
export type ProjectInfo = {
    amplifyMeta?: $TSAny;
    awsConfigInfo?: $TSAny;
    backendConfig?: $TSAny;
    existingLocalAwsInfo?: $TSAny;
    existingProjectConfig?: $TSAny;
    existingTeamProviderInfo?: $TSAny;
    isNewProject?: boolean;
    inputParams: $TSObject;
    localEnvInfo: LocalEnvInfo;
    projectConfig?: $TSAny;
    serviceMeta?: $TSAny;
    teamProviderInfo?: $TSAny;
};
//# sourceMappingURL=exeInfo.d.ts.map