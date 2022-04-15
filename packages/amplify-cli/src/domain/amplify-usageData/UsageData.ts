/* eslint-disable class-methods-use-this */
import { v4 as uuid } from 'uuid';
import https from 'https';
import { UrlWithStringQuery } from 'url';
import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import { pick } from 'lodash';
import { IFlowData, IFlowReport } from 'amplify-cli-shared-interfaces';
import { Input } from '../input';
import redactInput from './identifiable-input-regex';
import { UsageDataPayload, InputOptions } from './UsageDataPayload';
import { getUrl } from './getUsageDataUrl';
import {
  IUsageData, TimedCodePath, ProjectSettings, StartableTimedCodePath, StoppableTimedCodePath, FromStartupTimedCodePaths,
} from './IUsageData';
import { Timer } from './Timer';
import { CLIFlowReport } from './FlowReport';

/**
 * Singleton class that manages the lifecycle of usage data during a CLI command
 */
export class UsageData implements IUsageData, IFlowData {
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

  private static instance: UsageData;
  private static flow : CLIFlowReport;

  private constructor() {
    this.sessionUuid = uuid();
    this.url = getUrl();
    this.input = new Input([]);
    this.projectSettings = {};
    this.inputOptions = {};

    console.log(`SACPCDEBUG:GGGGG: USAGEDATA: ${JSON.stringify(this.url, null, 2)}`);
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
    UsageData.flow.setInput(input);
  }

  /**
   * Get the usage data singleton
   */
  static get Instance(): IUsageData {
    if (!UsageData.instance) {
      UsageData.instance = new UsageData();
      UsageData.flow = CLIFlowReport.instance;
    }
    return UsageData.instance;
  }

  /**
   * Get the flow data singleton
   */
  static get flowInstance(): IFlowData {
    if (!UsageData.flow) {
      UsageData.flow = CLIFlowReport.instance;
    }
    return UsageData.flow;
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
  setIsHeadless( isHeadless: boolean ){
    if (UsageData.flow)  {
      UsageData.flow.setIsHeadless( isHeadless );
    }
  } 

 /**
   * Append record to non-interactive Flow data
   * @param headlessParameterString - Stringified headless parameter string
   * @param input  - CLI input entered by Cx
   */
  pushHeadlessFlow( headlessParameterString: string ) {
    if (UsageData.flow)  {
      UsageData.flow.pushHeadlessFlow( headlessParameterString );
    }
  }

  /**
   * Append record to CLI Flow data
   * @param prompt - CLI interactive prompt
   * @param input  - CLI input entered by Cx
   */
  pushInteractiveFlow(prompt: string, input: unknown):void {
    if (UsageData.flow)  {
      UsageData.flow.pushInteractiveFlow(prompt, input);
    }
  }

  /**
   * Get the JSON version of the Flow Report.
   */
  getFlowReport() : IFlowReport {
    if (UsageData.flow) {
      return UsageData.flow.getFlowReport();
    }
    return {} as IFlowReport;
  }

  /**
   * Generate a unique searchable
   */
  assignProjectIdentifier() : string|undefined {
    if (UsageData.flow) {
      return UsageData.flow.assignProjectIdentifier();
    }
    return undefined;
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
    UsageData.flowInstance.assignProjectIdentifier();
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
      UsageData.flowInstance.getFlowReport() as IFlowReport,
    );
    console.log('SACPCDEBUG: UsageData: ', JSON.stringify(payload, null, 2));
    await this.send(payload);
    return payload;
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
