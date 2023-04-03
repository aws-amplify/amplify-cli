import { IAM } from 'aws-sdk';
import { $TSContext } from 'amplify-cli-core';
export declare class IAMClient {
    private static instance;
    readonly client: IAM;
    static getInstance(context: $TSContext, options?: IAM.ClientConfiguration): Promise<IAMClient>;
    private constructor();
}
//# sourceMappingURL=aws-iam.d.ts.map