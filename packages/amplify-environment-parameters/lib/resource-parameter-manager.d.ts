export declare class ResourceParameterManager {
    private params;
    getParam(name: string): string | undefined;
    setParam(name: string, value: string): void;
    setParams(params: Record<string, string>): void;
    deleteParam(name: string): void;
    getAllParams(): Readonly<Record<string, string>>;
    setAllParams(params: Record<string, string>): void;
    hasParam(name: string): boolean;
    hasAnyParams(): boolean;
}
//# sourceMappingURL=resource-parameter-manager.d.ts.map