export declare function exportBackend(cwd: string, settings: {
    exportPath: string;
}): Promise<void>;
export declare function exportPullBackend(cwd: string, settings: {
    exportPath: string;
    frontend: string;
    rootStackName: string;
}): Promise<void>;
