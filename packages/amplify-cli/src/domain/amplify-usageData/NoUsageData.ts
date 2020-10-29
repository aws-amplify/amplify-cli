import { IUsageData } from './IUsageData';

export class NoUsageData implements IUsageData {
  emitError(error: Error): Promise<void> {
    return Promise.resolve();
  }
  emitInvoke(): Promise<void> {
    return Promise.resolve();
  }
  emitAbort(): Promise<void> {
    return Promise.resolve();
  }
  emitSuccess(): Promise<void> {
    return Promise.resolve();
  }
  init(installationUuid: String, version: String, input: any): void {}

  private static instance: NoUsageData;
  static get Instance(): IUsageData {
    if (!NoUsageData.instance) NoUsageData.instance = new NoUsageData();
    return NoUsageData.instance;
  }
}
