import { ITelemetry } from './ITelemetry';

export class NoTelemetry implements ITelemetry {
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

  private static instance: NoTelemetry;
  static get Instance(): ITelemetry {
    if (!NoTelemetry.instance) NoTelemetry.instance = new NoTelemetry();
    return NoTelemetry.instance;
  }
}
