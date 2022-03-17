import { Input } from '../input';
import { ProjectSettings } from './UsageDataPayload';

export interface IUsageData {
  emitError(error: Error): Promise<void>;
  emitInvoke(): Promise<void>;
  emitAbort(): Promise<void>;
  emitSuccess(): Promise<void>;
  init(installationUuid: string, version: string, input: Input, accountId: string, projectSettings: ProjectSettings): void;
}
