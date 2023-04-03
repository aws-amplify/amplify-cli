import { IFlowData } from '@aws-amplify/amplify-cli-shared-interfaces';
import { IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
import { IUsageData, IUsageDataPayload } from 'amplify-cli-core';
export declare class NoUsageData implements IUsageData, IFlowData {
    private static instance;
    private static flow;
    getUsageDataPayload(error: Error | null, state: string): IUsageDataPayload;
    calculatePushNormalizationFactor(): void;
    getSessionUuid(): string;
    emitError(): Promise<void>;
    emitAbort(): Promise<void>;
    emitSuccess(): Promise<void>;
    init(): void;
    startCodePathTimer(): void;
    stopCodePathTimer(): void;
    pushInteractiveFlow: () => void;
    pushHeadlessFlow: () => void;
    setIsHeadless: () => void;
    getFlowReport(): IFlowReport | Record<string, never>;
    assignProjectIdentifier(): string | undefined;
    static get Instance(): IUsageData;
    static get flowInstance(): IFlowData;
}
//# sourceMappingURL=NoUsageData.d.ts.map