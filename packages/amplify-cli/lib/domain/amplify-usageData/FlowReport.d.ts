import { CLIInput } from '../command-input';
import { IAmplifyLogger } from '@aws-amplify/amplify-cli-logger';
import { ICommandInput, IFlowData, IFlowReport, TypeOptionFlowData } from '@aws-amplify/amplify-cli-shared-interfaces';
export declare class CLIFlowReport implements IFlowData {
    version: string;
    runtime: string;
    executable: string;
    category: string;
    isHeadless: boolean;
    cmd: string;
    subCmd: string | undefined;
    optionFlowData: Array<TypeOptionFlowData>;
    logger: IAmplifyLogger;
    input: CLIInput;
    timestamp: string;
    projectEnvIdentifier?: string;
    projectIdentifier?: string;
    envName?: string;
    constructor();
    assignProjectIdentifier(): undefined | string;
    setInput(input: CLIInput): void;
    setVersion(version: string): void;
    getFlowReport(): IFlowReport;
    setIsHeadless(isHeadless: boolean): void;
    pushInteractiveFlow(prompt: string, input: unknown): void;
    pushHeadlessFlow(headlessParameterString: string, cliInput: ICommandInput): void;
}
//# sourceMappingURL=FlowReport.d.ts.map