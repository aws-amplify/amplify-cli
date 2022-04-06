import { ICommandInput } from './amplify-cli-interactions';
export interface IFlowReport {
    version: string;
    runtime: string;
    executable: string;
    category: string;
    cmd: string;
    subCmd: string | undefined;
    optionFlow: Array<Record<string, unknown>>;
    input: ICommandInput;
    timestamp: string;
    projectEnvIdentifier?: string;
    projectIdentifier?: string;
}
export interface IFlowData {
    pushFlow: (flowData: Record<string, unknown>) => void;
    getFlowReport: () => IFlowReport | Record<string, never>;
}
//# sourceMappingURL=amplify-cli-flow-reporter-types.d.ts.map