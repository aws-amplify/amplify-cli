export * from './add-circleci-tags';
export * from './api';
export * from './appsync';
export * from './envVars';
export * from './getAppId';
export * from './headless';
export * from './overrides';
export * from './nexpect';
export * from './pinpoint';
export * from './projectMeta';
export * from './readJsonFile';
export * from './request';
export * from './retrier';
export * from './sdk-calls';
export * from './selectors';
export * from './sleep';
export * from './transformConfig';
export * from './admin-ui';
export * from './hooks';
export * from './git-operations';
export * from './help';
/**
 * Whether the current environment is CircleCI or not
 */
export declare const isCI: () => boolean;
export declare const TEST_PROFILE_NAME: string;
/**
 * delete project directory
 */
export declare const deleteProjectDir: (root: string) => void;
/**
 * delete <project-root>/amplify directory
 */
export declare const deleteAmplifyDir: (root: string) => void;
/**
 * load test file
 */
export declare const loadFunctionTestFile: (fileName: string) => string;
/**
 * install and save node dependencies
 */
export declare const addNodeDependencies: (root: string, functionName: string, dependencies: string[]) => void;
/**
 * copy node function code from source to target
 */
export declare const overrideFunctionCodeNode: (root: string, functionName: string, sourceFileName: string, targetFileName?: string) => void;
/**
 * copy python function code from source to target
 */
export declare const overrideFunctionCodePython: (root: string, functionName: string, sourceFileName: string, targetFileName?: string) => void;
/**
 * overwrite node function /src
 */
export declare const overrideFunctionSrcNode: (root: string, functionName: string, content: string, targetFileName?: string) => void;
/**
 * overwrite node function /src
 */
export declare const overrideFunctionSrcPython: (root: string, functionName: string, content: string, targetFileName?: string) => void;
/**
 * overwrite node layer content
 */
export declare const overrideLayerCodeNode: (root: string, projectName: string, layerName: string, content: string, targetFileName?: string) => void;
/**
 * overwrite python layer content
 */
export declare const overrideLayerCodePython: (root: string, projectName: string, layerName: string, content: string, targetFileName?: string) => void;
/**
 * write target file to layer resource's opt/<targetFileName>
 */
export declare const addOptFile: (root: string, projectName: string, layerName: string, content: string, targetFileName: string) => void;
/**
 * get node function source file
 */
export declare const getFunctionSrcNode: (root: string, functionName: string, fileName?: string) => string;
/**
 * Generate short v4 UUID
 * @returns short UUID
 */
export declare const generateRandomShortId: () => string;
