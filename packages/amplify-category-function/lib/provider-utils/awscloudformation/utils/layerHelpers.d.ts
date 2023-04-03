import { $TSAny, $TSContext, $TSMeta } from 'amplify-cli-core';
import { CheckboxQuestion, InputQuestion, ListQuestion } from 'inquirer';
import { LayerParameters, LayerPermission, LayerVersionMetadata, PermissionEnum } from './layerParams';
export interface LayerInputParams {
    layerPermissions?: PermissionEnum[];
    accountIds?: string[];
    orgIds?: string[];
}
export declare function mapVersionNumberToChoice(layerVersion: LayerVersionMetadata): string;
export declare function layerVersionQuestion(versions: string[], message: string, defaultOption?: string): ListQuestion;
export declare function layerNameQuestion(projectName: string): InputQuestion;
export declare function layerPermissionsQuestion(params?: PermissionEnum[]): CheckboxQuestion;
export declare function layerAccountAccessPrompt(defaultAccountIds?: string[]): Promise<string[]>;
export declare function layerOrgAccessPrompt(defaultOrgs?: string[]): Promise<string[]>;
export declare function previousPermissionsQuestion(): ListQuestion;
export declare function layerInputParamsToLayerPermissionArray(parameters: LayerInputParams): LayerPermission[];
export declare function loadStoredLayerParameters(context: $TSContext, layerName: string): LayerParameters;
export declare function isNewVersion(layerName: string): Promise<boolean>;
export declare function isMultiEnvLayer(layerName: string): boolean;
export declare function getLayerName(context: $TSContext, layerName: string): string;
export declare function getLambdaFunctionsDependentOnLayerFromMeta(layerName: string, meta: $TSMeta): [string, unknown][];
export declare function ensureLayerVersion(context: $TSContext, layerName: string, previousHash?: string): Promise<string>;
export declare function loadPreviousLayerHash(layerName: string): string | undefined;
export declare const hashLayerResource: (layerPath: string, resourceName: string) => Promise<string>;
export declare function getChangedResources(resources: Array<$TSAny>): Promise<Array<$TSAny>>;
//# sourceMappingURL=layerHelpers.d.ts.map