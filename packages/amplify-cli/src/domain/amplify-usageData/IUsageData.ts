import { Input } from '../input';

export interface IUsageData {
  emitError(error: Error): Promise<void>;
  emitInvoke(): Promise<void>;
  emitAbort(): Promise<void>;
  emitSuccess(): Promise<void>;
  init(installationUuid: String, version: String, input: Input): void;
}
