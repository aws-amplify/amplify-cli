export declare class AmplifySpinner {
    private frameCount;
    private frames;
    private timer;
    private prefixText;
    private terminal;
    private refreshRate;
    constructor();
    private render;
    start(text: string | null): void;
    resetMessage(text: string | null): void;
    stop(text?: string | null, success?: boolean): void;
}
//# sourceMappingURL=spinner.d.ts.map