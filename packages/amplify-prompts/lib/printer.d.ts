/// <reference types="node" />
export declare class AmplifyPrinter implements Printer {
    private readonly outputStream;
    constructor(outputStream?: NodeJS.WritableStream);
    debug: (line: string) => void;
    info: (line: string, color?: Color) => void;
    blankLine: () => void;
    success: (line: string) => void;
    warn: (line: string) => void;
    error: (line: string) => void;
    private writeSilenceableLine;
    private writeLine;
}
export declare const printer: Printer;
export type Printer = {
    debug: (line: string) => void;
    info: (line: string, color?: Color) => void;
    blankLine: () => void;
    success: (line: string) => void;
    warn: (line: string) => void;
    error: (line: string) => void;
};
type Color = 'green' | 'blue' | 'yellow' | 'red' | 'reset';
export {};
//# sourceMappingURL=printer.d.ts.map