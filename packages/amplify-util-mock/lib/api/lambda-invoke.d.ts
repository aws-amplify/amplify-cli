import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager } from '@aws-amplify/amplify-function-plugin-interface';
import { LambdaTrigger, LambdaTriggerConfig } from '../utils/lambda/find-lambda-triggers';
export declare const invokeTrigger: (context: $TSContext, trigger: LambdaTrigger, data: $TSAny) => Promise<void>;
export declare const buildLambdaTrigger: (runtimeManager: FunctionRuntimeLifecycleManager, triggerConfig: Pick<LambdaTriggerConfig, 'runtime' | 'directory' | 'runtimePluginId'>) => Promise<void>;
//# sourceMappingURL=lambda-invoke.d.ts.map