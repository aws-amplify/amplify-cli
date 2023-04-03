declare function validateProject(projRoot: string, platform: string): void;
declare function validateProjectConfig(projRoot: string, platform: string, framework?: string): void;
declare function validateApi(projRoot: string): void;
declare function validateBackendConfig(projRoot: string): void;
declare function validateModelgen(projRoot: string): void;
declare function validateAmplifyPush(projRoot: string): void;
declare function validateFeatureFlags(projRoot: string): void;
export { validateProject, validateProjectConfig, validateApi, validateBackendConfig, validateModelgen, validateAmplifyPush, validateFeatureFlags, };
