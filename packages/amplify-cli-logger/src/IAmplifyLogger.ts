import { LogErrorPayload, LogPayload } from './Types';

export interface IAmplifyLogger {
  logError(content: LogErrorPayload): void;
  logInfo(content: LogPayload): void;
  projectLocalLogInit(projecPath: string): void;
  loggerEnd(): void;
}
