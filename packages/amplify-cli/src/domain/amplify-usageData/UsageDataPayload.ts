import * as os from 'os';
import { isCI } from 'amplify-cli-core';
import { IFlowReport } from 'amplify-cli-shared-interfaces';
import { Input } from '../input';
import { getLatestPayloadVersion } from './VersionManager';
import { SerializableError } from './SerializableError';
import { ProjectSettings, TimedCodePath } from './IUsageData';

/**
 * Metadata that is sent to the usage data endpoint
 */
export class UsageDataPayload {
  sessionUuid: string;
  installationUuid: string;
  amplifyCliVersion: string;
  input: Input | null;
  inputOptions: InputOptions;
  timestamp: string;
  error!: SerializableError;
  payloadVersion: string;
  osPlatform: string;
  osRelease: string;
  nodeVersion: string;
  state: string;
  isCi: boolean;
  accountId: string;
  projectSetting: ProjectSettings;
  codePathDurations: Partial<Record<TimedCodePath, number>>;
  flowReport: IFlowReport;
  pushNormalizationFactor = 1;
  constructor(
    sessionUuid: string,
    installationUuid: string,
    version: string,
    input: Input,
    error: Error | null,
    state: string,
    accountId: string,
    project: ProjectSettings,
    inputOptions: InputOptions,
    codePathDurations: Partial<Record<TimedCodePath, number>>,
    flowReport : IFlowReport,
  ) {
    this.sessionUuid = sessionUuid;
    this.installationUuid = installationUuid;
    this.amplifyCliVersion = version;
    this.input = input;
    this.timestamp = new Date().toISOString();
    this.osPlatform = os.platform();
    this.osRelease = os.release();
    this.nodeVersion = process.versions.node;
    this.state = state;
    this.payloadVersion = getLatestPayloadVersion();
    this.accountId = accountId;
    this.isCi = isCI();
    this.projectSetting = project;
    this.inputOptions = inputOptions;
    this.codePathDurations = codePathDurations;
    this.flowReport = flowReport;
    if (error) {
      this.error = new SerializableError(error);
    }
  }
}

/**
 * Command-line args that were specified to the currently running command
 */
export type InputOptions = Record<string, string | boolean>;
