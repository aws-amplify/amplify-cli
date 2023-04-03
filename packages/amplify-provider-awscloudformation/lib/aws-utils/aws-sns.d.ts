import { $TSContext } from 'amplify-cli-core';
export declare class SNS {
    private static instance;
    private readonly sns;
    static getInstance(context: $TSContext, options?: {}): Promise<SNS>;
    private constructor();
    isInSandboxMode(): Promise<boolean>;
}
//# sourceMappingURL=aws-sns.d.ts.map