import { Context } from './domain/context';
import { AmplifyEvent, AmplifyEventArgs } from 'amplify-cli-core';
export declare const executeCommand: (context: Context) => Promise<void>;
export declare const isContainersEnabled: (context: Context) => boolean;
export declare const raisePrePushEvent: (context: Context) => Promise<void>;
export declare const raiseInternalOnlyPostEnvRemoveEvent: (context: Context, envName: string) => Promise<void>;
export declare const raisePostEnvAddEvent: (context: Context, prevEnvName: string, newEnvName: string) => Promise<void>;
export declare const raiseEvent: <T extends AmplifyEvent>(context: Context, args: AmplifyEventArgs<T>) => Promise<void>;
//# sourceMappingURL=execution-manager.d.ts.map