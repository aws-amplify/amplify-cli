import { $TSAny, isCI, CommandLineInput } from 'amplify-cli-core';
import { IFlowReport } from 'amplify-cli-shared-interfaces';
import * as os from 'os';
import { InputOptions, IUsageDataPayload, ProjectSettings, TimedCodePath } from './UsageDataTypes';
import { SerializableError } from './SerializableError';
import { getLatestPayloadVersion } from './VersionManager';

/**
 * Metadata that is sent to the usage data endpoint
 */
export class UsageDataPayload implements IUsageDataPayload {
  sessionUuid: string;
  installationUuid: string;
  amplifyCliVersion: string;
  input: CommandLineInput | null;
  inputOptions: InputOptions;
  timestamp: string;
  error!: SerializableError;
  downstreamException!: SerializableError;
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
    input: CommandLineInput,
    error: Error | null,
    state: string,
    accountId: string,
    project: ProjectSettings,
    inputOptions: InputOptions,
    codePathDurations: Partial<Record<TimedCodePath, number>>,
    flowReport: IFlowReport,
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
      if ('downstreamException' in error && (error as $TSAny).downstreamException) {
        this.downstreamException = new SerializableError((error as $TSAny).downstreamException as Error);
      }
    }
  }
}
