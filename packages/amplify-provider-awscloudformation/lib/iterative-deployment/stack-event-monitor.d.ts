import { StackEvent } from 'aws-sdk/clients/cloudformation';
import * as aws from 'aws-sdk';
export interface StackEventMonitorOptions {
    pollDelay: number;
}
export interface IStackProgressPrinter {
    addActivity: (activity: StackEvent) => void;
    print: () => void;
    printEventProgress: () => void;
    printDefaultLogs: () => void;
    updateIndexInHeader: (currentIndex: number, totalIndices: number) => void;
    finishBars: () => void;
    stopBars: () => void;
    isRunning: () => boolean;
}
export declare class StackEventMonitor {
    private cfn;
    private stackName;
    private printerFn;
    private addEventActivity;
    private active;
    private tickTimer?;
    private options;
    private readPromise?;
    private startTime;
    private activity;
    private completedStacks;
    private stacksBeingMonitored;
    private lastPolledStackIndex;
    private logger;
    constructor(cfn: aws.CloudFormation, stackName: string, printerFn: () => void, addEventActivity: (event: any) => void, options?: StackEventMonitor);
    start(): StackEventMonitor;
    stop(): Promise<void>;
    private scheduleNextTick;
    private tick;
    private readNewEvents;
    private processNestedStack;
    private finalPollToEnd;
}
//# sourceMappingURL=stack-event-monitor.d.ts.map