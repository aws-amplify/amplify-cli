/* eslint-disable class-methods-use-this */
import { v4 as uuid } from 'uuid';
import https from 'https';
import { UrlWithStringQuery } from 'url';
import { JSONUtilities } from 'amplify-cli-core';
import { pick } from 'lodash';
import { ICommandInput, IFlowReport } from 'amplify-cli-shared-interfaces';
import { prompter } from 'amplify-prompts';
import { Input } from '../input';
import redactInput from './identifiable-input-regex';
import { UsageDataPayload, InputOptions } from './UsageDataPayload';
import { getUrl } from './getUsageDataUrl';
import {
  IUsageData,
  TimedCodePath,
  ProjectSettings,
  StartableTimedCodePath,
  StoppableTimedCodePath,
  FromStartupTimedCodePaths,
  ManuallyTimedCodePath,
} from './IUsageData';
import { Timer } from './Timer';
import { CLIFlowReport } from './FlowReport';

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
  codePathTimers = new Map<TimedCodePath, Timer>();
  codePathDurations = new Map<TimedCodePath, number>();
  flow: CLIFlowReport = new CLIFlowReport();
  pushNormalizationFactor = 1;
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
  init(
    installationUuid: string,
    version: string,
    input: Input,
    accountId: string,
    projectSettings: ProjectSettings,
    processStartTimeStamp: number,
  ): void {
    this.installationUuid = installationUuid;
    this.accountId = accountId;
    this.projectSettings = projectSettings;
    this.version = version;
    this.inputOptions = input.options ? pick(input.options as InputOptions, ['sandboxId']) : {};
    this.input = redactInput(input, true);
    this.codePathTimers.set(FromStartupTimedCodePaths.PLATFORM_STARTUP, Timer.start(processStartTimeStamp));
    this.codePathTimers.set(FromStartupTimedCodePaths.TOTAL_DURATION, Timer.start(processStartTimeStamp));
    this.flow.setInput(input);
    this.flow.setVersion(version);
  }

  /**
   * Get the usage data singleton
   */
  static get Instance(): IUsageData {
    if (!UsageData.instance) {
      UsageData.instance = new UsageData();
    }
    return UsageData.instance;
  }

  /**
   * Emit usage data on error
   */
  async emitError(error: Error | null): Promise<void> {
    await this.emit(error, WorkflowState.FAILED);
  }

  /**
   * Emit usage data when command aborted (ctrl c)
   */
  async emitAbort(): Promise<void> {
    await this.emit(null, WorkflowState.ABORTED);
  }

  /**
   * Emit usage data on successful completion of command
   */
  async emitSuccess(): Promise<void> {
    await this.emit(null, WorkflowState.SUCCESSFUL);
  }

  /**
   * Starts a timer for the specified code path
   */
  startCodePathTimer(codePath: StartableTimedCodePath): void {
    if (this.codePathTimers.has(codePath)) {
      throw new Error(`${codePath} already has a running timer`);
    }
    this.codePathTimers.set(codePath, Timer.start());
  }

  /**
   * Stops and records the specified code path timer
   */
  stopCodePathTimer(codePath: StoppableTimedCodePath): void {
    this.internalStopCodePathTimer(codePath);
  }

  /**
   * Set context is in headless mode
   * @param isHeadless - when set to true assumes context in headless
   */
  setIsHeadless(isHeadless: boolean): void {
    this.flow.setIsHeadless(isHeadless);
  }

  /**
    * Append record to non-interactive Flow data
    * @param headlessParameterString - Stringified headless parameter string
    * @param input  - CLI input entered by Cx
    */
  pushHeadlessFlow(headlessParameterString: string, input: ICommandInput): void {
    this.flow.pushHeadlessFlow(headlessParameterString, input);
  }

  /**
   * Append record to CLI Flow data
   * @param prompt - CLI interactive prompt
   * @param input  - CLI input entered by Cx
   */
  pushInteractiveFlow(prompt: string, input: unknown): void {
    this.flow.pushInteractiveFlow(prompt, input);
  }

  /**
   * Get the JSON version of the Flow Report.
   */
  getFlowReport(): IFlowReport {
    return this.flow.getFlowReport();
  }

  /**
   * Generate a unique searchable
   */
  assignProjectIdentifier(): string | undefined {
    return this.flow.assignProjectIdentifier();
  }

  /**
   * Calculates all the leaves that were updated
   * @param events CloudFormation Stack Events
   */
  calculatePushNormalizationFactor(events: { StackId: string, PhysicalResourceId: string } [], StackId: string) : void {
    const cfnStackStack = [StackId];
    let count = 0;
    while (cfnStackStack.length !== 0) {
      const head = cfnStackStack.pop();
      const children = events.filter(r => r.StackId === head && r.PhysicalResourceId !== head)
        .map(r => r.PhysicalResourceId)
        .reduce((set, val) => set.add(val), new Set<string>());
      if (children.size > 0) {
        cfnStackStack.push(...children.values());
      } else {
        count++;
      }
    }
    this.pushNormalizationFactor = count;
  }

  private internalStopCodePathTimer = (codePath: TimedCodePath): void => {
    const timer = this.codePathTimers.get(codePath);
    if (!timer) {
      return;
    }
    this.codePathDurations.set(codePath, timer.stop());
    this.codePathTimers.delete(codePath);
  }

  private async emit(error: Error | null, state: string): Promise<UsageDataPayload> {
    // initialize the unique project identifier if work space is initialized
    this.flow.assignProjectIdentifier();

    // add prompt time
    this.codePathDurations.set(ManuallyTimedCodePath.PROMPT_TIME, prompter.getTotalPromptElapsedTime());

    // stop all currently running timers
    Array.from(this.codePathTimers.keys()).forEach(this.internalStopCodePathTimer);

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
      Object.fromEntries(this.codePathDurations),
      this.flow.getFlowReport() as IFlowReport,
    );
    payload.pushNormalizationFactor = this.pushNormalizationFactor;
    await this.send(payload);

    return payload;
  }

  /**
  * get usage data partial payload to use in reporter
  */
  getUsageDataPayload(error: Error | null, state: string): UsageDataPayload {
    return new UsageDataPayload(
      this.sessionUuid,
      this.installationUuid,
      this.version,
      this.input,
      error,
      state,
      this.accountId,
      this.projectSettings,
      this.inputOptions,
      Object.fromEntries(this.codePathDurations),
      this.flow.getFlowReport() as IFlowReport,
    );
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
  ABORTED = 'ABORTED',
  FAILED = 'FAILED',
}
