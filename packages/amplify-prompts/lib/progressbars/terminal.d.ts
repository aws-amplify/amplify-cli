export type TerminalLine = {
    renderString: string;
    color: string;
};
export declare class AmplifyTerminal {
    private lastHeight;
    private trailingEmptyLines;
    private readonly stream;
    constructor();
    isTTY(): boolean;
    private get width();
    getLastHeight(): number;
    private get height();
    writeLines(lines: TerminalLine[]): void;
    cursor(enabled: boolean): void;
    newLine(): void;
}
//# sourceMappingURL=terminal.d.ts.map