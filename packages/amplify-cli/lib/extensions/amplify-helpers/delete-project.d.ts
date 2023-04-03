import { $TSContext } from 'amplify-cli-core';
export declare const deleteProject: (context: $TSContext) => Promise<void>;
export declare const getConfirmation: (context: $TSContext, env?: string | undefined) => Promise<{
    proceed: boolean;
    deleteS3: boolean;
    deleteAmplifyApp: boolean;
}>;
//# sourceMappingURL=delete-project.d.ts.map