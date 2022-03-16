import { Input } from '../input';

/**
 * Base interface for emitting usage data
 */
export interface IUsageData {
  emitError: (error: Error) => Promise<void>;
  emitInvoke: () => Promise<void>;
  emitAbort: () => Promise<void>;
  emitSuccess: () => Promise<void>;
  init: (installationUuid: string, version: string, input: Input, accountId: string, projectSettings: ProjectSettings) => void;
  startCodePathTimer: (codePath: TimedCodePath) => void;
  stopCodePathTimer: (codePath: TimedCodePath) => void;
}

/**
 * Code paths that are timed
 */
export enum TimedCodePath {
  START_TO_PLUGIN_DISPATCH = 'START_TO_PLUGIN_DISPATCH',
  CATEGORY_BUILD = 'CATEGORY_BUILD',
  PRE_DEPLOYMENT_UPLOAD = 'PRE_DEPLOYMENT_UPLOAD',
  DEPLOYMENT = 'DEPLOYMENT',
  POST_DEPLOYMENT_UPLOAD = 'POST_DEPLOYMENT_UPLOAD',
  POST_DEPLOYMENT_TO_EXIT = 'POST_DEPLOYMENT_TO_EXIT',
}

/**
 * Additional frontend metadata for the metric
 */
export type ProjectSettings = {
  frontend?: string;
  editor?: string;
  framework?: string;
};
