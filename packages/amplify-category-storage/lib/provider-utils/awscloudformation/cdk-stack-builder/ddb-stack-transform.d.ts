import { $TSContext } from 'amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from '../service-walkthroughs/dynamoDB-input-state';
import { AmplifyDDBResourceStack } from './ddb-stack-builder';
import { AmplifyDDBResourceInputParameters } from './types';
export declare class DDBStackTransform {
    app: cdk.App;
    _context: $TSContext;
    _cliInputs: DynamoDBCLIInputs;
    _resourceTemplateObj: AmplifyDDBResourceStack | undefined;
    _cliInputsState: DynamoDBInputState;
    _cfn: string;
    _cfnInputParams: AmplifyDDBResourceInputParameters;
    _resourceName: string;
    constructor(context: $TSContext, resourceName: string);
    transform(): Promise<void>;
    generateCfnInputParameters(): void;
    generateStack(): Promise<void>;
    applyOverrides(): Promise<void>;
    saveBuildFiles(): void;
}
//# sourceMappingURL=ddb-stack-transform.d.ts.map