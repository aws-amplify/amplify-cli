import uuid from 'uuid';
import { Input } from '../input';
import https from 'https';
import { UrlWithStringQuery } from 'url';
import redactInput from './identifiable-input-regex';
import { UsageDataPayload } from './UsageDataPayload';
import { getUrl } from './getUsageDataUrl';
import { IUsageData } from './IUsageData';

export class UsageData implements IUsageData {
  sessionUuid: String;
  installationUuid: String = '';
  version: String = '';
  input: Input;
  url: UrlWithStringQuery;
  requestTimeout: number = 100;
  private static instance: UsageData;

  private constructor() {
    this.sessionUuid = uuid.v4();
    this.url = getUrl();
    this.input = new Input([]);
  }

  init(installationUuid: String, version: String, input: Input): void {
    this.installationUuid = installationUuid;
    this.version = version;
    this.input = redactInput(input, true);
  }

  static get Instance(): IUsageData {
    if (!UsageData.instance) UsageData.instance = new UsageData();
    return UsageData.instance;
  }

  emitError(error: Error | null): Promise<void> {
    return this.emit(error, WorkflowState.Failed);
  }
  emitInvoke(): Promise<void> {
    return this.emit(null, WorkflowState.Invoke);
  }
  emitAbort(): Promise<void> {
    return this.emit(null, WorkflowState.Aborted);
  }
  emitSuccess(): Promise<void> {
    return this.emit(null, WorkflowState.Successful);
  }

  async emit(error: Error | null, state: String): Promise<void> {
    const payload = new UsageDataPayload(this.sessionUuid, this.installationUuid, this.version, this.input, error, state);
    return this.send(payload);
  }

  async send(payload: UsageDataPayload) {
    return new Promise<void>((resolve, _) => {
      const data = JSON.stringify(payload);
      const req = https.request({
        hostname: this.url.hostname,
        port: this.url.port,
        path: this.url.path,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': data.length,
        },
      });
      req.on('error', () => {});
      req.setTimeout(this.requestTimeout, () => {
        resolve();
      });
      req.write(data);
      req.end(() => {
        resolve();
      });
    });
  }
}

enum WorkflowState {
  Successful = 'SUCCEEDED',
  Invoke = 'INVOKED',
  Aborted = 'ABORTED',
  Failed = 'FAILED',
}
