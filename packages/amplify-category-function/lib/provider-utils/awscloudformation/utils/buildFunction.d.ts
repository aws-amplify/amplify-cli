import { $TSContext } from 'amplify-cli-core';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';
export declare const buildFunction: (context: $TSContext, { resourceName, lastBuildTimestamp, lastBuildType, buildType }: BuildRequestMeta) => Promise<string>;
export interface BuildRequestMeta {
    resourceName: string;
    lastBuildTimestamp?: string;
    lastBuildType?: BuildType;
    buildType?: BuildType;
}
export declare const buildTypeKeyMap: Record<BuildType, string>;
//# sourceMappingURL=buildFunction.d.ts.map