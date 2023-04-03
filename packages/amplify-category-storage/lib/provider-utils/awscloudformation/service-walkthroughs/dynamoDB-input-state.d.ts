import { $TSContext } from 'amplify-cli-core';
import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
export declare class DynamoDBInputState {
    private readonly context;
    _cliInputsFilePath: string;
    _resourceName: string;
    _category: string;
    _service: string;
    buildFilePath: string;
    constructor(context: $TSContext, resourceName: string);
    getCliInputPayload(): DynamoDBCLIInputs;
    cliInputFileExists(): boolean;
    isCLIInputsValid(cliInputs?: DynamoDBCLIInputs): Promise<void>;
    saveCliInputPayload(cliInputs: DynamoDBCLIInputs): Promise<void>;
    migrate(): Promise<void>;
}
//# sourceMappingURL=dynamoDB-input-state.d.ts.map