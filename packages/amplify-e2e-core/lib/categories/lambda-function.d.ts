import { ExecutionContext } from '..';
import { Lambda } from 'aws-sdk';
type FunctionRuntimes = 'dotnet6' | 'dotnetCore31' | 'go' | 'java' | 'nodejs' | 'python';
type FunctionCallback = (chain: any, cwd: string, settings: any) => any;
export declare const runtimeChoices: string[];
export type CoreFunctionSettings = {
    testingWithLatestCodebase?: boolean;
    name?: string;
    functionTemplate?: string;
    expectFailure?: boolean;
    additionalPermissions?: any;
    schedulePermissions?: any;
    layerOptions?: LayerOptions;
    environmentVariables?: any;
    secretsConfig?: AddSecretInput | UpdateSecretInput | DeleteSecretInput;
    triggerType?: string;
    eventSource?: string;
};
export declare const addFunction: (cwd: string, settings: CoreFunctionSettings, runtime: FunctionRuntimes, functionConfigCallback?: FunctionCallback) => Promise<unknown>;
export declare const updateFunction: (cwd: string, settings: CoreFunctionSettings, runtime: FunctionRuntimes) => Promise<unknown>;
export declare const addLambdaTrigger: (chain: ExecutionContext, cwd: string, settings: any) => ExecutionContext;
export declare const functionBuild: (cwd: string) => Promise<void>;
export declare const selectRuntime: (chain: ExecutionContext, runtime: FunctionRuntimes) => void;
export declare const selectTemplate: (chain: ExecutionContext, functionTemplate: string, runtime: FunctionRuntimes) => void;
export declare const createNewDynamoDBForCrudTemplate: (chain: ExecutionContext) => void;
export declare const removeFunction: (cwd: string, funcName: string) => Promise<void>;
export interface LayerOptions {
    select?: string[];
    layerAndFunctionExist?: boolean;
    expectedListOptions?: string[];
    versions?: Record<string, {
        version: number;
        expectedVersionOptions: number[];
    }>;
    customArns?: string[];
    skipLayerAssignment?: boolean;
    layerWalkthrough?: (chain: ExecutionContext) => void;
}
export type EnvVarInput = {
    key: string;
    value: string;
};
export type AddSecretInput = {
    operation: 'add';
    name: string;
    value: string;
};
export type DeleteSecretInput = {
    operation: 'delete';
    name: string;
};
export type UpdateSecretInput = {
    operation: 'update';
    name: string;
    value: string;
};
export declare const functionMockAssert: (cwd: string, settings: {
    funcName: string;
    successString: string;
    eventFile: string;
    timeout?: number;
}, testingWithLatestCodebase?: boolean) => Promise<void>;
export declare const functionCloudInvoke: (cwd: string, settings: {
    funcName: string;
    payload: string;
}) => Promise<Lambda.InvocationResponse>;
export declare function validateNodeModulesDirRemoval(projRoot: any): void;
export {};
