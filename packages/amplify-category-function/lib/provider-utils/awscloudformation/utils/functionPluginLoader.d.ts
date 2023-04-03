import { FunctionParameters, FunctionRuntimeParameters, FunctionTemplateParameters, FunctionRuntimeLifecycleManager } from '@aws-amplify/amplify-function-plugin-interface';
import { LayerParameters } from './layerParams';
import { $TSAny, $TSContext } from 'amplify-cli-core';
export declare function templateWalkthrough(context: $TSContext, params: Partial<FunctionParameters>): Promise<FunctionTemplateParameters>;
export declare function runtimeWalkthrough(context: $TSContext, params: Partial<FunctionParameters> | Partial<LayerParameters>): Promise<Array<Pick<FunctionParameters, 'runtimePluginId'> & FunctionRuntimeParameters>>;
export declare function loadPluginFromFactory(pluginPath: string, expectedFactoryFunction: string, context: $TSContext): Promise<$TSAny>;
export declare function getRuntimeManager(context: $TSContext, resourceName: string): Promise<FunctionRuntimeLifecycleManager & {
    runtime: string;
}>;
//# sourceMappingURL=functionPluginLoader.d.ts.map