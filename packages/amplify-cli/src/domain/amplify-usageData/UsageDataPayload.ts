import * as os from 'os';
import { Input } from '../input';
import { getLatestPayloadVersion } from './VersionManager';
import ci from 'ci-info';
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
    this.isCi = ci.isCI;
    this.projectSetting = project;
    this.inputOptions = inputOptions;
    if (error) {
      this.error = new SerializableError(error);
    }
  }
}

export type ProjectSettings = {
  frontend?: string;
  editor?: string;
  framework?: string;
};

export type InputOptions = Record<string, string | boolean>;
export class SerializableError {
  name: string;
  constructor(error: Error) {
    this.name = error.name;
  }
}
