export declare function updateSchema(projectDir: string, projectName: string, schemaText: string): void;
export declare function updateConfig(projectDir: string, projectName: string, config?: any): void;
export declare function setCustomRolesConfig(projectDir: string, apiName: string, config?: any): void;
export declare function addCustomResolver(projectDir: string, apiName: string, resolverName: string, resolver: string): void;
export declare function writeToCustomResourcesJson(projectDir: string, apiName: string, json?: Record<string, unknown>): void;
export declare function setTransformerVersionFlag(cwd: string, transformerVersion: number): void;
