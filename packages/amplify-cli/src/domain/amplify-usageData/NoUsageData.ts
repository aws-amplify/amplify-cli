/* eslint-disable class-methods-use-this */
import { ICommandInput, IFlowData } from 'amplify-cli-shared-interfaces';
import { IFlowReport } from 'amplify-cli-shared-interfaces/lib/amplify-cli-flow-reporter-types';
import { CommandLineInput } from 'amplify-cli-core';
import { IUsageData } from './UsageDataTypes';
import { CLINoFlowReport } from './NoFlowReport';
import { UsageDataPayload } from './UsageDataPayload';

/**
 * Noop implementation of IUsageData used when customers have usage data turned off
 */
export class NoUsageData implements IUsageData, IFlowData {
  private static instance: NoUsageData;
  private static flow: CLINoFlowReport;

  /**
   * Return a default payload
   * @param error - error to include in the payload
   * @param state - state to include in the payload
   * @returns UsageDataPayload
   */
  getUsageDataPayload(error: Error | null, state: string): UsageDataPayload {
    return new UsageDataPayload(
      '',
      '',
      '',
      new CommandLineInput([]),
      error,
      state,
      '',
      {},
      {},
      {},
      {
        version: '',
        category: '',
        cmd: '',
        executable: '',
        input: { argv: [] },
        isHeadless: true,
        optionFlowData: [],
        runtime: '',
        subCmd: '',
        timestamp: '',
      },
    );
  }

  /**
   *  Noop implementation of calculatePushNormalizationFactor
   */
  calculatePushNormalizationFactor(__events: { StackId: string; PhysicalResourceId: string }[], __stackId: string): void {
    /* noop */
  }

  /**
   * Noop implementation of getSessionUuid
   */
  getSessionUuid(): string {
    return '';
  }

  /**
   * Noop implementation of emitError
   */
  emitError(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Noop implementation of emitAbort
   */
  emitAbort(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Noop implementation of emitSuccess
   */
  emitSuccess(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Noop implementation of init
   */
  init(): void {
    /* noop */
  }

  /**
   *  Noop implementation of startCodePathTimer
   */
  startCodePathTimer(): void {
    /* noop */
  }

  /**
   *  Noop implementation of stopCodePathTimer
   */
  stopCodePathTimer(): void {
    /* noop */
  }

  /**
   * Noop function
   */
  pushInteractiveFlow = (__prompt: string, __input: unknown): void => {
    /* noop */
  };

  /**
   * Noop function
   */
  pushHeadlessFlow = (__headlessFlowDataString: string, __input: ICommandInput): void => {
    /* noop */
  };

  /**
   * Noop function to set isHeadless flag in flowLogger
   * @param __headless unused
   */
  setIsHeadless = (__headless: boolean): void => {
    /* noop */
  };

  /**
   * Empty function is for flow report.
   * @returns empty object
   */
  getFlowReport(): IFlowReport | Record<string, never> {
    return {};
  }

  /**
   * NoOp function to assign Project identifier
   * @returns undefined
   */
  assignProjectIdentifier(): string | undefined {
    return undefined;
  }

  /**
   * Get or create the singleton instance
   */
  static get Instance(): IUsageData {
    if (!NoUsageData.instance) {
      NoUsageData.instance = new NoUsageData();
    }
    return NoUsageData.instance;
  }

  /**
   * Get or create the singleton instance
   */
  static get flowInstance(): IFlowData {
    if (!NoUsageData.flow) NoUsageData.flow = CLINoFlowReport.instance;
    return NoUsageData.flow;
  }
}
