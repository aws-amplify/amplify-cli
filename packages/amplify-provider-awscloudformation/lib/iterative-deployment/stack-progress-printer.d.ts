import type { StackEvent } from 'aws-sdk/clients/cloudformation';
import { EventMap } from '../utils/progress-bar-helpers';
import { IStackProgressPrinter } from './stack-event-monitor';
export declare class StackProgressPrinter implements IStackProgressPrinter {
    private events;
    private progressBars;
    private eventMap;
    private categoriesPrinted;
    constructor(eventMap: EventMap);
    addActivity: (event: StackEvent) => void;
    updateIndexInHeader: (currentIndex: number, totalIndices: number) => void;
    print: () => void;
    printEventProgress: () => void;
    printDefaultLogs: () => void;
    finishBars: () => void;
    stopBars: () => void;
    isRunning: () => boolean;
}
//# sourceMappingURL=stack-progress-printer.d.ts.map