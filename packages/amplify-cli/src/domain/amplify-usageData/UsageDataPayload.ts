import os from 'os';
import { Input } from '../input';
import { getLatestPayloadVersion } from './VersionManager';

export class UsageDataPayload {
  sessionUuid: String;
  installationUuid: String;
  amplifyCliVersion: String;
  input: Input | null;
  timestamp: String;
  error!: SerializableError;
  payloadVersion: String;
  osPlatform: String;
  osRelease: String;
  nodeVersion: String;
  state: String;
  constructor(sessionUuid: String, installationUuid: String, version: String, input: Input, error: Error | null, state: String) {
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
    if (error) {
      this.error = new SerializableError(error);
    }
  }
}
export class SerializableError {
  name: String;
  constructor(error: Error) {
    this.name = error.name;
  }
}
