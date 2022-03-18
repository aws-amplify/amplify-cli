/* eslint-disable class-methods-use-this */
import { IUsageData } from './IUsageData';

/**
 * Noop implementation of IUsageData used when customers have usage data turned off
 */
export class NoUsageData implements IUsageData {
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

  private static instance: NoUsageData;
  /**
   * Get or create the singleton instance
   */
  static get Instance(): IUsageData {
    if (!NoUsageData.instance) NoUsageData.instance = new NoUsageData();
    return NoUsageData.instance;
  }
}
