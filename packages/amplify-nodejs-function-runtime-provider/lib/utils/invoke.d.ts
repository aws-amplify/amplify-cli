export declare const invoke: (options: InvokeOptions) => Promise<any>;
export type InvokeOptions = {
    packageFolder: string;
    handler: string;
    event: string;
    context?: object;
    environment?: {
        [key: string]: string;
    };
};
//# sourceMappingURL=invoke.d.ts.map