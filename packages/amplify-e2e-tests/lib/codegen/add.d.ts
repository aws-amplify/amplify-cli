type AddCodegenSettings = {
    ios?: boolean;
    android?: boolean;
    apiId?: string;
};
/**
 * Execute a `codegen add` command for testing purposes.
 * @param cwd working directory to execute the command in
 * @param settings configuration settings for the command
 */
export declare const addCodegen: (cwd: string, settings: AddCodegenSettings) => Promise<void>;
export {};
