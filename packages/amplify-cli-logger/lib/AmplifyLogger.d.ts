import winston, { Logger } from 'winston';
import { IAmplifyLogger } from './IAmplifyLogger';
import { LogPayload, LogErrorPayload } from './Types';
export declare class AmplifyLogger implements IAmplifyLogger {
    logger: Logger;
    loggerFormat: winston.Logform.Format;
    disabledAmplifyLogging: boolean;
    constructor();
    loggerEnd(): void;
    private formatter;
    projectLocalLogInit(projectPath: string): void;
    logInfo(content: LogPayload): void;
    logError(content: LogErrorPayload): void;
}
//# sourceMappingURL=AmplifyLogger.d.ts.map