import uuid from 'uuid';
import { Input } from '../input';
import https from 'https';
import { UrlWithStringQuery } from 'url';
import redactInput from './identifiable-input-regex';
import { ProjectSettings, UsageDataPayload, InputOptions } from './UsageDataPayload';
import { getUrl } from './getUsageDataUrl';
import { IUsageData } from './IUsageData';
import { JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';
export class UsageData implements IUsageData {
  sessionUuid: string;
  accountId: string = '';
  installationUuid: string = '';
  version: string = '';
  input: Input;
  projectSettings: ProjectSettings;
  url: UrlWithStringQuery;
  inputOptions: InputOptions;
  requestTimeout: number = 100;
  private static instance: UsageData;

  private constructor() {
    this.sessionUuid = uuid.v4();
    this.url = getUrl();
    this.input = new Input([]);
    this.projectSettings = {};
    this.inputOptions = {};
  }

  init(installationUuid: string, version: string, input: Input, accountId: string, projectSettings: ProjectSettings): void {
    this.installationUuid = installationUuid;
    this.accountId = accountId;
    this.projectSettings = projectSettings;
    this.version = version;
    this.inputOptions = input.options ? _.pick(input.options as InputOptions, ['sandboxId']) : {};
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

  async emit(error: Error | null, state: string): Promise<void> {
    const payload = new UsageDataPayload(
      this.sessionUuid,
      this.installationUuid,
      this.version,
      this.input,
      error,
      state,
      this.accountId,
      this.projectSettings,
      this.inputOptions,
    );
    return this.send(payload);
  }

  async send(payload: UsageDataPayload) {
    return new Promise<void>((resolve, _) => {
      const data: string = JSONUtilities.stringify(payload, {
        minify: true,
      })!;
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
