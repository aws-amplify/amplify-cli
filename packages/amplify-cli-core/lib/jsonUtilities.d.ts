export declare class JSONUtilities {
    static readJson: <T>(fileName: string, options?: {
        throwIfNotExist?: boolean;
        preserveComments?: boolean;
    }) => T | undefined;
    static writeJson: (fileName: string, data: unknown, options?: {
        mode?: number;
        minify?: boolean;
        secureFile?: boolean;
        orderedKeys?: boolean;
    }) => void;
    static parse: <T>(jsonString: string, options?: {
        preserveComments?: boolean;
    }) => T;
    static stringify: (data: unknown, options?: {
        minify?: boolean;
        orderedKeys?: boolean;
    }) => string;
}
//# sourceMappingURL=jsonUtilities.d.ts.map