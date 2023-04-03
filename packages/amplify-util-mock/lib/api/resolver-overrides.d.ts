export declare class ResolverOverrides {
    private _rootFolder;
    private _foldersToWatch;
    private fileExtensions;
    private overrides;
    private contentMap;
    constructor(_rootFolder: string, _foldersToWatch?: string[], fileExtensions?: string[]);
    start(): void;
    onFileChange(filePath: string): boolean;
    sync(transformerResolvers: {
        path: string;
        content: string;
    }[], userOverriddenSlots: string[]): {
        path: string;
        content: string;
    }[];
    stop(): void;
    isTemplateFile(filePath: string, isDelete?: boolean): boolean;
    private updateContentMap;
    private getRelativePath;
    private getAbsPath;
    onAdd(path: string): boolean;
    onChange(path: string): boolean;
    onUnlink(path: string): boolean;
    get resolverTemplateRoot(): string;
}
//# sourceMappingURL=resolver-overrides.d.ts.map