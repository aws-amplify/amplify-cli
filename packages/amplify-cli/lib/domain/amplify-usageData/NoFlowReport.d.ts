import { FlowRecorder } from 'amplify-cli-core';
import { ICommandInput, IFlowReport } from '@aws-amplify/amplify-cli-shared-interfaces';
export declare class CLINoFlowReport implements FlowRecorder {
    private static _instance;
    pushInteractiveFlow: (prompt: string, input: unknown) => void;
    getFlowReport: () => IFlowReport | Record<string, never>;
    assignProjectIdentifier: () => string | undefined;
    setIsHeadless: (isHeadless: boolean) => void;
    pushHeadlessFlow: (headlessFlowDataString: string, input: ICommandInput) => void;
    static get instance(): CLINoFlowReport;
}
//# sourceMappingURL=NoFlowReport.d.ts.map