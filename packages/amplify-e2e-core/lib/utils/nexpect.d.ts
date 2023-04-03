import { Recorder } from '../asciinema-recorder';
declare global {
    namespace NodeJS {
        interface Global {
            storeCLIExecutionLog: (data: any) => void;
        }
    }
}
export declare const RETURN: string;
export declare const KEY_UP_ARROW = "\u001B[A";
export declare const KEY_DOWN_ARROW = "\u001B[B";
export declare const CONTROL_C = "\u0003";
export declare const CONTROL_A = "\u0001";
export declare const SPACE_BAR = " ";
type ExecutionStep = {
    fn: (data: string) => boolean;
    shift: boolean;
    description: string;
    requiresInput: boolean;
    name: string;
    expectation?: any;
};
/**
 *
 */
export type Context = {
    command: string;
    cwd: string | undefined;
    env: any | undefined;
    ignoreCase: boolean;
    params: string[];
    queue: ExecutionStep[];
    stripColors: boolean;
    process: Recorder | undefined;
    noOutputTimeout: number;
    getRecording: () => string;
};
/**
 *
 */
export type ExecutionContext = {
    expect: (expectation: string | RegExp) => ExecutionContext;
    pauseRecording: () => ExecutionContext;
    resumeRecording: () => ExecutionContext;
    wait: (expectation: string | RegExp, cb?: (data: string) => void) => ExecutionContext;
    sendLine: (line: string) => ExecutionContext;
    sendCarriageReturn: () => ExecutionContext;
    send: (line: string) => ExecutionContext;
    sendKeyDown: (repeat?: number) => ExecutionContext;
    sendKeyUp: (repeat?: number) => ExecutionContext;
    /**
     * @deprecated If using `amplify-prompts` sending a newline after 'y' is not required and could cause problems. Use `sendYes` instead.
     */
    sendConfirmYes: () => ExecutionContext;
    sendYes: () => ExecutionContext;
    /**
     * @deprecated If using `amplify-prompts` sending a newline after 'n' is not required and could cause problems. Use `sendNo` instead.
     */
    sendConfirmNo: () => ExecutionContext;
    sendNo: () => ExecutionContext;
    sendCtrlC: () => ExecutionContext;
    sendCtrlA: () => ExecutionContext;
    selectAll: () => ExecutionContext;
    sendEof: () => ExecutionContext;
    delay: (milliseconds: number) => ExecutionContext;
    /**
     * @deprecated Use runAsync
     */
    run: (cb: (err: any, signal?: any) => void) => ExecutionContext;
    runAsync: (expectedErrorPredicate?: (err: Error) => boolean) => Promise<void>;
};
/**
 *
 */
export type SpawnOptions = {
    noOutputTimeout?: number;
    cwd?: string | undefined;
    env?: object | any;
    stripColors?: boolean;
    ignoreCase?: boolean;
    disableCIDetection?: boolean;
};
/**
 *
 */
export declare function nspawn(command: string | string[], params?: string[], options?: SpawnOptions): ExecutionContext;
export {};
