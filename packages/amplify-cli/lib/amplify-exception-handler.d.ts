import { $TSAny } from 'amplify-cli-core';
import { Context } from './domain/context';
export declare const init: (_context: Context) => void;
export declare const handleException: (exception: unknown) => Promise<void>;
export declare const handleUnhandledRejection: (reason: Error | $TSAny) => void;
//# sourceMappingURL=amplify-exception-handler.d.ts.map