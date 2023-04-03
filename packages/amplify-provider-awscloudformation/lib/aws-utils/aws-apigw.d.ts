import { $TSContext } from 'amplify-cli-core';
import { APIGateway as APIGW } from 'aws-sdk';
export declare class APIGateway {
    private static instance;
    private readonly context;
    readonly apigw: APIGW;
    static getInstance(context: $TSContext, options?: {}): Promise<APIGateway>;
    constructor(context: $TSContext, creds: any, options?: {});
}
//# sourceMappingURL=aws-apigw.d.ts.map