/* eslint-disable class-methods-use-this */
import { IFlowData } from '@aws-amplify/amplify-cli-shared-interfaces';
import { IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
import { CLIInput } from '../command-input';
import { IUsageData, IUsageDataPayload, ProjectSettings } from '@aws-amplify/amplify-cli-core';
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
  getUsageDataPayload(error: Error | null, state: string): IUsageDataPayload {
    return new UsageDataPayload(
      '',
      '',
      '',
      new CLIInput([]),
      error,
      state,
      '',
      {} as unknown as ProjectSettings,
      {},
      {},
      {
        version: '',
        category: '',
        cmd: '',
        executable: '',
        input: { argv: [], command: '' },
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
  calculatePushNormalizationFactor(): void {
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
  pushInteractiveFlow = (): void => {
    /* noop */
  };

  /**
   * Noop function
   */
  pushHeadlessFlow = (): void => {
    /* noop */
  };

  /**
   * Noop function to set isHeadless flag in flowLogger
   * @param __headless unused
   */
  setIsHeadless = (): void => {
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
