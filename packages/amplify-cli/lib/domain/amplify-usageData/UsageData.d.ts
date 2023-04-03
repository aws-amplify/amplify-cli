/// <reference types="node" />
import { ICommandInput, IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
import { UrlWithStringQuery } from 'url';
import { CLIInput } from '../command-input';
import { InputOptions, IUsageData, IUsageDataPayload, ProjectSettings, StartableTimedCodePath, StoppableTimedCodePath, TimedCodePath } from 'amplify-cli-core';
import { CLIFlowReport } from './FlowReport';
import { Timer } from './Timer';
export declare class UsageData implements IUsageData {
    sessionUuid: string;
    accountId: string;
    installationUuid: string;
    version: string;
    input: CLIInput;
    projectSettings: ProjectSettings;
    url: UrlWithStringQuery;
    inputOptions: InputOptions;
    requestTimeout: number;
    codePathTimers: Map<TimedCodePath, Timer>;
    codePathDurations: Map<TimedCodePath, number>;
    flow: CLIFlowReport;
    pushNormalizationFactor: number;
    private static instance;
    private constructor();
    init(installationUuid: string, version: string, input: CLIInput, accountId: string, projectSettings: ProjectSettings, processStartTimeStamp: number): void;
    static get Instance(): IUsageData;
    getSessionUuid(): string;
    emitError(error: Error | null): Promise<void>;
    emitAbort(): Promise<void>;
    emitSuccess(): Promise<void>;
    startCodePathTimer(codePath: StartableTimedCodePath): void;
    stopCodePathTimer(codePath: StoppableTimedCodePath): void;
    setIsHeadless(isHeadless: boolean): void;
    pushHeadlessFlow(headlessParameterString: string, input: ICommandInput): void;
    pushInteractiveFlow(prompt: string, input: unknown): void;
    getFlowReport(): IFlowReport;
    assignProjectIdentifier(): string | undefined;
    calculatePushNormalizationFactor(events: {
        StackId: string;
        PhysicalResourceId: string;
    }[], StackId: string): void;
    private internalStopCodePathTimer;
    private emit;
    getUsageDataPayload(error: Error | null, state: string): IUsageDataPayload;
    private send;
}
//# sourceMappingURL=UsageData.d.ts.map