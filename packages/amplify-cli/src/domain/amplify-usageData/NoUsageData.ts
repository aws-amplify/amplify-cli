/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable class-methods-use-this */
import { $TSAny } from 'amplify-cli-core';
import { IFlowReport } from 'amplify-cli-shared-interfaces/lib/amplify-cli-flow-reporter-types';
import { IFlowData } from 'amplify-cli-shared-interfaces';
import { CLINoFlowReport } from './NoFlowReport';
import { IUsageData } from './IUsageData';

/**
 * Noop implementation of IUsageData used when customers have usage data turned off
 */
export class NoUsageData implements IUsageData, IFlowData {
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
  init(): void { /* noop */ }

  /**
   *  Noop implementation of startCodePathTimer
   */
  startCodePathTimer(): void { /* noop */ }

  /**
   *  Noop implementation of stopCodePathTimer
   */
  stopCodePathTimer(): void { /* noop */ }

  /**
   * Noop function 
   * @param _prompt 
   * @param _input accepted from the CLI
   */
  // eslint-disable-next-line class-methods-use-this
  pushInteractiveFlow = (_prompt: string, _input: unknown) : void  => {
    /* noop */ 
  }

  /**
   * Noop function
   * @param _headlessFlowDataString accepted from the CLI
   */
  // eslint-disable-next-line class-methods-use-this
  pushHeadlessFlow = (_headlessFlowDataString : string) : void  => {
    /* noop */ 
  }

  /**
   * Noop function to set isHeadless flag in flowLogger
   * @param _headless 
   */
  setIsHeadless =  (_headless: boolean): void => {
    /* noop */ 
  }

  /**
   * Empty function is for flow report.
   * @returns empty object
   */
  getFlowReport() : IFlowReport | Record<string, never> {
    return {};
  }

  /**
   * NoOp function to assign Project identifier
   * @returns undefined
   */
  assignProjectIdentifier() : string | undefined {
    return undefined;
  }

  private static instance: NoUsageData;
  private static flow: CLINoFlowReport;
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
