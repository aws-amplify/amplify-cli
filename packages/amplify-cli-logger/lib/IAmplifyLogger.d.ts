import { LogErrorPayload, LogPayload } from './Types';
export interface IAmplifyLogger {
    logError(content: LogErrorPayload): void;
    logInfo(content: LogPayload): void;
    projectLocalLogInit(projectPath: string): void;
    loggerEnd(): void;
}
//# sourceMappingURL=IAmplifyLogger.d.ts.map