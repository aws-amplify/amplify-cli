import { TerminalLine } from './terminal';
import { ProgressBar as Bar, BarOptions, ItemPayload, ProgressPayload } from './progressbar';
export declare class MultiProgressBar {
    private count;
    private terminal;
    private options;
    private bars;
    private lastDrawnTime;
    isActive: boolean;
    private refreshRate;
    private frameCount;
    private frames;
    private timer;
    private prefixText;
    private updated;
    private lastDrawnStrings;
    constructor(options: BarOptions);
    isTTY(): boolean;
    writeLines(terminalLine: TerminalLine): void;
    render(): void;
    getBar(name: string): {
        name: string;
        bar: Bar;
    } | undefined;
    updateBar(name: string, updateObj: {
        name: string;
        payload: ItemPayload;
    }): void;
    incrementBar(name: string, value: number): void;
    finishBar(name: string): void;
    finishAllBars(): void;
    create(bars: {
        name: string;
        value: number;
        total: number;
        payload: ProgressPayload;
    }[]): void;
    updatePrefixText(newPrefixText: string): void;
    getBarCount(): number;
    stop(): void;
}
//# sourceMappingURL=multibar.d.ts.map