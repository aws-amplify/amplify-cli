import { CategoryInputState, $TSContext } from '@aws-amplify/amplify-cli-core';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
export declare class AuthInputState extends CategoryInputState {
    #private;
    private readonly context;
    constructor(context: $TSContext, resourceName: string);
    isCLIInputsValid(cliInputs?: CognitoCLIInputs): Promise<boolean>;
    getCLIInputPayload(): CognitoCLIInputs;
    cliInputFileExists(): boolean;
    saveCLIInputPayload(cliInputs: CognitoCLIInputs): Promise<void>;
    loadResourceParameters(context: $TSContext, cliInputs: CognitoCLIInputs): Promise<CognitoStackOptions>;
}
//# sourceMappingURL=auth-input-state.d.ts.map