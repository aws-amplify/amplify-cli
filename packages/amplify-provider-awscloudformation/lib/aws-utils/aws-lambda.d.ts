import { $TSContext } from 'amplify-cli-core';
import { Lambda as AwsSdkLambda } from 'aws-sdk';
export declare class Lambda {
    private readonly context;
    private lambda;
    constructor(context: $TSContext, options?: {});
    listLayerVersions(layerNameOrArn: string): Promise<AwsSdkLambda.LayerVersionsListItem[]>;
    deleteLayerVersions(layerNameOrArn: string, versions: number[]): Promise<void>;
}
//# sourceMappingURL=aws-lambda.d.ts.map