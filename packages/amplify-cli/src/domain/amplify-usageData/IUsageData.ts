import { IFlowData } from 'amplify-cli-shared-interfaces';
import { Input } from '../input';
import { UsageDataPayload } from './UsageDataPayload';

/**
 * Base interface for emitting usage data
 */
interface IUsageMetricsData {
  emitError: (error: Error) => Promise<void>;
  emitAbort: () => Promise<void>;
  emitSuccess: () => Promise<void>;
  init: (
    installationUuid: string,
    version: string,
    input: Input,
    accountId: string,
    projectSettings: ProjectSettings,
    processStartTimeStamp: number
  ) => void;
  getUsageDataPayload: (error: Error | null, state: string) => UsageDataPayload
  startCodePathTimer: (codePath: StartableTimedCodePath) => void;
  stopCodePathTimer: (codePath: StoppableTimedCodePath) => void;
  calculatePushNormalizationFactor: (events: { StackId: string, PhysicalResourceId: string } [], StackId: string) => void;
}

/**
 * Interface for UsageData
 */
export interface IUsageData extends IUsageMetricsData, IFlowData {
}

/**
 * Code path timers that should start immediately when the CLI process starts
 */
export enum FromStartupTimedCodePaths {
  PLATFORM_STARTUP = 'platformStartup', // time from CLI process start to plugin invoke. This timer is auto started on process startup
  TOTAL_DURATION = 'totalDuration', // time from CLI process start to exit
}

/**
 * Code path timers that should not end until the process exits
 */
export enum UntilExitTimedCodePath {
  POST_PROCESS = 'postProcess' // time from plugin exit to process exit. This timer is automatically stopped at the end of the process
}

/**
 * Timed code paths that must be explicitly started and stopped at defined code points
 */
export enum ManuallyTimedCodePath {
  // general paths (applies to all commands)
  PLUGIN_TIME = 'pluginTime', // time spent in command handler plugin

  // push-specific paths
  PUSH_TRANSFORM = 'pushTransform', // total time spent transforming resources and uploading assets to prepare for a push
  PUSH_DEPLOYMENT = 'pushDeployment', // time spent deploying CFN

  // init-specific paths (also called during env checkout and pull)
  INIT_ENV_PLATFORM = 'initEnvPlatform', // time to call awscloudformation provider initEnv. This includes downloading deployment bucket and updating local files
  INIT_ENV_CATEGORIES = 'initEnvCategories', // time to call all of the category's initEnv methods

  PROMPT_TIME = 'promptTime'// total time to takes to answer a prompt
}

/**
 * Code path timers that can be manually started
 */
export type StartableTimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath;

/**
 * Code path timers that can be manually stopped
 */
export type StoppableTimedCodePath = ManuallyTimedCodePath | FromStartupTimedCodePaths;

/**
 * All timed code paths
 */
export type TimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath | FromStartupTimedCodePaths;

/**
 * Additional frontend metadata for the metric
 */
export type ProjectSettings = {
  frontend?: string;
  editor?: string;
  framework?: string;
};
