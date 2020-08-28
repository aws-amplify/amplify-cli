import { LogErrorPayload, LogPayload } from './Types';

export interface IAmplifyLogger {
  log(message: string): void;
  logError(content: LogErrorPayload): void;
  logInfo(content: LogPayload): void;
  projectLocalLogInit(projecPath: string): void;
}
