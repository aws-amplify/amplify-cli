import { $TSContext, $TSObject } from 'amplify-cli-core';
import * as AWS from 'aws-sdk';
export declare class SSM {
    private static instance;
    readonly client: AWS.SSM;
    static getInstance(context: $TSContext, options?: $TSObject): Promise<SSM>;
    private constructor();
}
//# sourceMappingURL=aws-ssm.d.ts.map