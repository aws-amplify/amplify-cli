import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionParameters, FunctionTriggerParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { IsMockableResponse } from '../..';
import { ServiceConfig } from '../supportedServicesType';
import { ServiceName } from './utils/constants';
import { LayerParameters } from './utils/layerParams';
export declare function addResource(context: $TSContext, category: string, service: ServiceName, options: $TSAny, parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>): Promise<string>;
export declare function addFunctionResource(context: $TSContext, category: string, service: ServiceName, serviceConfig: ServiceConfig<FunctionParameters>, parameters?: Partial<FunctionParameters> | FunctionTriggerParameters): Promise<string>;
export declare function addLayerResource(context: $TSContext, service: ServiceName, serviceConfig: ServiceConfig<LayerParameters>, parameters?: Partial<LayerParameters>): Promise<string>;
export declare function updateResource(context: $TSContext, category: string, service: ServiceName, parameters?: Partial<FunctionParameters> | FunctionTriggerParameters | Partial<LayerParameters>, resourceToUpdate?: $TSAny): Promise<any>;
export declare function updateFunctionResource(context: $TSContext, category: string, service: ServiceName, parameters: $TSAny, resourceToUpdate: $TSAny): Promise<any>;
export declare function updateLayerResource(context: $TSContext, service: ServiceName, serviceConfig: ServiceConfig<LayerParameters>, parameters?: Partial<LayerParameters>): Promise<void>;
export declare function migrateResource(context: $TSContext, projectPath: string, service: ServiceName, resourceName: string): any;
export declare function getPermissionPolicies(context: $TSContext, service: ServiceName, resourceName: string, crudOptions: $TSAny): any;
export declare function updateConfigOnEnvInit(context: $TSContext, resourceName: string, service: ServiceName): Promise<any>;
export declare function openConsole(context: $TSContext, service: ServiceName): Promise<void>;
export declare function isMockable(service: ServiceName): IsMockableResponse;
//# sourceMappingURL=index.d.ts.map