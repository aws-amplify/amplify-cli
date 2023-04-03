import { $TSContext } from 'amplify-cli-core';
export declare function start(context: $TSContext): Promise<void>;
export interface InvokerOptions {
    timeout?: string;
}
export declare const timeConstrainedInvoker: <T>(promise: Promise<T>, options?: InvokerOptions) => Promise<T>;
//# sourceMappingURL=index.d.ts.map