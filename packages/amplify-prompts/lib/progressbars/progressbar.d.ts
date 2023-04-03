import { TerminalLine } from './terminal';
export type BarOptions = {
    progressBarFormatter: (payload: ProgressPayload, value: number, total: number) => string;
    itemFormatter: (payload: ItemPayload) => {
        renderString: string;
        color: string;
    };
    loneWolf: boolean;
    hideCursor: boolean;
    barCompleteChar: string;
    barIncompleteChar: string;
    barSize: number;
    itemCompleteStatus: string[];
    itemFailedStatus: string[];
    prefixText: string;
    successText: string;
    failureText: string;
};
export type ProgressPayload = {
    progressName: string;
    envName: string;
};
export type ItemPayload = {
    LogicalResourceId: string;
    ResourceType: string;
    ResourceStatus: string;
    Timestamp: string;
};
type Item = {
    name: string;
    status: string;
    renderString: string;
    color: string;
    finished: boolean;
};
export declare class ProgressBar {
    private value;
    private total;
    private terminal;
    private payload;
    private isActive;
    private options;
    private lastDrawnTime;
    private items;
    barCompleteString: string;
    barIncompleteString: string;
    barSize: number;
    constructor(options: BarOptions);
    createBarString(): string;
    getRenderStrings(): TerminalLine[];
    getValue(): number;
    render(): void;
    isFinished(): boolean;
    isFailed(): boolean;
    start(total: number, startValue: number, payload: ProgressPayload): void;
    stop(): void;
    hasItem(name: string): boolean;
    getItem(name: string): Item | undefined;
    addItem(name: string, itemPayload: ItemPayload): void;
    updateItem(name: string, newPayload: ItemPayload): void;
    increment(value?: number): void;
    finish(): void;
}
export {};
//# sourceMappingURL=progressbar.d.ts.map