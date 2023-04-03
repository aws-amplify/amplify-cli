export declare const addCDKCustomResource: (cwd: string, settings: any) => Promise<void>;
export declare const addCFNCustomResource: (cwd: string, settings: any, testingWithLatestCodebase?: boolean) => Promise<void>;
export declare function buildCustomResources(cwd: string, usingLatestCodebase?: boolean): Promise<unknown>;
export declare const useLatestExtensibilityHelper: (projectRoot: string, customResourceName: string) => void;
