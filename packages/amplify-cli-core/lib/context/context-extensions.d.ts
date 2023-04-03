import { $TSContext } from '../types';
export declare function attachExtensions(context: $TSContext): void;
export declare function attachPrint(context: $TSContext): void;
export declare function info(message: string): void;
export declare function warning(message: string): void;
export declare function error(message: string): void;
export declare function success(message: string): void;
export declare function green(message: string): void;
export declare function yellow(message: string): void;
export declare function red(message: string): void;
export declare function blue(message: string): void;
export declare function fancy(message?: string): void;
export declare function debug(message: string, title?: string): void;
export declare function table(data: string[][], options?: {
    format?: 'markdown' | 'lean';
}): void;
export declare const print: {
    info: typeof info;
    fancy: typeof fancy;
    warning: typeof warning;
    error: typeof error;
    success: typeof success;
    table: typeof table;
    debug: typeof debug;
    green: typeof green;
    yellow: typeof yellow;
    red: typeof red;
    blue: typeof blue;
};
//# sourceMappingURL=context-extensions.d.ts.map