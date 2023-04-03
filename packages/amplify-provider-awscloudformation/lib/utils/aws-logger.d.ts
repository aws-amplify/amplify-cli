export type Logger = (crumb: string, args: any[]) => (error?: Error) => void;
export declare const fileLogger: (file: string) => (crumb: string, args: any[]) => (error?: Error) => void;
//# sourceMappingURL=aws-logger.d.ts.map