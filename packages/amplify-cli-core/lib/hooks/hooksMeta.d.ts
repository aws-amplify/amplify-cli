import { HookEvent, DataParameter, EventPrefix, ErrorParameter } from './hooksTypes';
import { CommandLineInput } from '../types';
export declare class HooksMeta {
    private static instance?;
    private hookEvent;
    private dataParameter;
    private errorParameter?;
    static getInstance: (input?: CommandLineInput, eventPrefix?: EventPrefix, errorParameter?: ErrorParameter) => HooksMeta;
    private constructor();
    getDataParameter(): DataParameter;
    getErrorParameter(): ErrorParameter | undefined;
    getHookEvent(): HookEvent;
    setEnvironmentName(envName?: string): void;
    setAmplifyVersion(amplifyVersion: string): void;
    setErrorParameter(errorParameter?: ErrorParameter): void;
    setEventCommand(command: string): void;
    setEventSubCommand(subCommand?: string): void;
    setEventPrefix(prefix?: EventPrefix): void;
    mergeDataParameter(newDataParameter: DataParameter): void;
    setHookEventFromInput(input?: CommandLineInput): void;
}
//# sourceMappingURL=hooksMeta.d.ts.map