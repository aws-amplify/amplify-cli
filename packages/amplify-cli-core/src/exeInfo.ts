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

export type FrameworkConfig = {
  SourceDir: string;
  BuildCommand: string;
  ServerlessContainers: boolean;
  DistributionDir: string;
  StartCommand: string;
};

export type ProjectFramework = {
  framework: string;
  config: FrameworkConfig;
};

export type FrontendFrameworks = 'javascript' | 'android' | 'ios' | 'flutter';

export type ProjectConfig = {
  providers: string[];
  projectName: string;
  projectPath: string;
  version: string;
  frontend: FrontendFrameworks;
  javascript?: ProjectFramework;
  flutter?: ProjectFramework;
  android?: ProjectFramework;
  ios?: ProjectFramework;
};

export type ProjectInfo = {
  amplifyMeta?: $TSAny;
  awsConfigInfo?: $TSAny;
  backendConfig?: $TSAny;
  existingLocalAwsInfo?: $TSAny;
  existingProjectConfig: ProjectConfig;
  existingTeamProviderInfo?: $TSAny;
  isNewProject?: boolean;
  inputParams: $TSObject;
  localEnvInfo: LocalEnvInfo;
  projectConfig: ProjectConfig;
  serviceMeta?: $TSAny;
  teamProviderInfo?: $TSAny;
};
