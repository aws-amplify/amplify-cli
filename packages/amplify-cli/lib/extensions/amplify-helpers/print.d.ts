declare function info(message: any): void;
declare function warning(message: any): void;
declare function error(message: any): void;
declare function success(message: any): void;
declare function debug(message: any, title?: string): void;
declare function table(data: any, options?: any): void;
export declare const print: {
    info: typeof info;
    warning: typeof warning;
    error: typeof error;
    success: typeof success;
    table: typeof table;
    debug: typeof debug;
};
export {};
//# sourceMappingURL=print.d.ts.map