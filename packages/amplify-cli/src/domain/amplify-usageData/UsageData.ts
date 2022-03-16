import { v4 as uuid } from 'uuid';
import https from 'https';
import { UrlWithStringQuery } from 'url';
import { JSONUtilities } from 'amplify-cli-core';
import { pick } from 'lodash';
import { Input } from '../input';
import redactInput from './identifiable-input-regex';
import { ProjectSettings, UsageDataPayload, InputOptions } from './UsageDataPayload';
import { getUrl } from './getUsageDataUrl';
import { IUsageData, TimedCodePath } from './IUsageData';
import { Timer } from './Timer';

/**
 * Singleton class that manages the lifecycle of usage data during a CLI command
 */
export class UsageData implements IUsageData {
  sessionUuid: string;
  accountId = '';
  installationUuid = '';
  version = '';
  input: Input;
  projectSettings: ProjectSettings;
  url: UrlWithStringQuery;
  inputOptions: InputOptions;
  requestTimeout = 100;
  codePathTimers: Partial<Record<TimedCodePath, Timer>> = {};
  codePathDurations: Partial<Record<TimedCodePath, number>> = {};

  private static instance: UsageData;

  private constructor() {
    this.sessionUuid = uuid();
    this.url = getUrl();
    this.input = new Input([]);
    this.projectSettings = {};
    this.inputOptions = {};
  }

  /**
   * Initialize the usage data object
   */
  init(installationUuid: string, version: string, input: Input, accountId: string, projectSettings: ProjectSettings): void {
    this.installationUuid = installationUuid;
    this.accountId = accountId;
    this.projectSettings = projectSettings;
    this.version = version;
    this.inputOptions = input.options ? pick(input.options as InputOptions, ['sandboxId']) : {};
    this.input = redactInput(input, true);
  }

  /**
   * Get the usage data singleton
   */
  static get Instance(): IUsageData {
    if (!UsageData.instance) UsageData.instance = new UsageData();
    return UsageData.instance;
  }

  /**
   * Emit usage data on error
   */
  emitError(error: Error | null): Promise<void> {
    return this.emit(error, WorkflowState.FAILED);
  }

  /**
   * Emit usage data at start of command execution
   */
  emitInvoke(): Promise<void> {
    return this.emit(null, WorkflowState.INVOKE);
  }

  /**
   * Emit usage data when command aborted (ctrl c)
   */
  emitAbort(): Promise<void> {
    return this.emit(null, WorkflowState.ABORTED);
  }

  /**
   * Emit usage data on successful completion of command
   */
  emitSuccess(): Promise<void> {
    return this.emit(null, WorkflowState.SUCCESSFUL);
  }

  /**
   * Starts a timer for the specified code path
   */
  startCodePathTimer(codePath: TimedCodePath): void {
    const timer = new Timer();
    timer.start();
    this.codePathTimers[codePath] = timer;
  }

  /**
   * Stops and records the specified code path timer
   */
  stopCodePathTimer(codePath: TimedCodePath): void {
    const timer = this.codePathTimers[codePath];
    if (!timer) {
      throw new Error(`Timer for ${codePath} not found`);
    }
    this.codePathDurations[codePath] = timer.stop();
    this.codePathTimers[codePath] = undefined;
  }

  private async emit(error: Error | null, state: string): Promise<void> {
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
      this.codePathDurations,
    );
    return this.send(payload);
  }

  private async send(payload: UsageDataPayload): Promise<void> {
    return new Promise<void>(resolve => {
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
      req.on('error', () => { /* noop */ });
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
  SUCCESSFUL = 'SUCCEEDED',
  INVOKE = 'INVOKED',
  ABORTED = 'ABORTED',
  FAILED = 'FAILED',
}
