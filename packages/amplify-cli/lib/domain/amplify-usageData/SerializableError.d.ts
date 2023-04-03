export declare class SerializableError {
    name: string;
    message: string;
    details?: string;
    code?: string;
    trace?: Trace[];
    constructor(error: Error);
}
declare type Trace = {
    methodName: string;
    file: string;
    lineNumber: string;
    columnNumber: string;
};
export {};
//# sourceMappingURL=SerializableError.d.ts.map