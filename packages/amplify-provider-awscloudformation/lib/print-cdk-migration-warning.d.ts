import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
export type AmplifyWarning = {
    impactedFiles: string[];
    resolutionMessage: string;
};
export declare const printCdkMigrationWarning: (context: $TSContext) => Promise<void>;
export declare const getMigrationMessage: (resourcesToBuild: IAmplifyResource[]) => string;
//# sourceMappingURL=print-cdk-migration-warning.d.ts.map