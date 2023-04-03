declare global {
    namespace NodeJS {
        interface Global {
            getTestName?: () => string;
            getHookName?: () => string;
            getDescibeBlocks?: () => string[];
        }
    }
}
export declare const addCircleCITags: (projectPath: string) => void;
export declare function sanitizeTagValue(value: string): string;
