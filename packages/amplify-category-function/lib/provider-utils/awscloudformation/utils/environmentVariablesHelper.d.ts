import { $TSContext } from 'amplify-cli-core';
export declare const validKey: RegExp;
export declare const getStoredEnvironmentVariables: (resourceName: string, currentEnvName?: string) => Record<string, string>;
export declare const saveEnvironmentVariables: (resourceName: string, newEnvironmentVariables: Record<string, string>) => void;
export declare const askEnvironmentVariableCarryOrUpdateQuestions: (context: $TSContext, fromEnvName: string, yesFlagSet?: boolean) => Promise<void>;
export declare const ensureEnvironmentVariableValues: (context: $TSContext) => Promise<void>;
//# sourceMappingURL=environmentVariablesHelper.d.ts.map