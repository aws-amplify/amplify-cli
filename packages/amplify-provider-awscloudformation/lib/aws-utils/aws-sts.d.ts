import { $TSContext } from 'amplify-cli-core';
export declare class STS {
    private static instance;
    private readonly context;
    private readonly sts;
    static getInstance(context: $TSContext, options?: {}): Promise<STS>;
    private constructor();
    getCallerIdentity(): Promise<AWS.STS.GetCallerIdentityResponse>;
}
//# sourceMappingURL=aws-sts.d.ts.map