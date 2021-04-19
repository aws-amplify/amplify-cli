import { $TSMeta } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface';
import { lambdaLayerSetting, resourceAccessSetting, ServiceName } from './constants';

export const consolidateDependsOnForLambda = (
  projectMeta: $TSMeta,
  currentDependsOn: FunctionDependency[],
  lambdaToUpdate: string,
  selectedSettings: string[],
): FunctionDependency[] => {
  let updatedDependsOn: FunctionDependency[];
  const prevFunctionParametersDependsOn: FunctionDependency[] = projectMeta?.function?.[`${lambdaToUpdate}`]?.dependsOn ?? [];
  if (selectedSettings.includes(resourceAccessSetting)) {
    // insert old lambdaLayer dependsOn if present
    const prevLayersDependsOn: FunctionDependency[] = prevFunctionParametersDependsOn.filter(
      resource => projectMeta?.function?.[`${resource.resourceName}`]?.service === ServiceName.LambdaLayer,
    );
    updatedDependsOn = currentDependsOn.concat(prevLayersDependsOn);
  }
  if (selectedSettings.includes(lambdaLayerSetting)) {
    //  insert resource dependsOn
    const prevDependsOnExcludingLayers: FunctionDependency[] = prevFunctionParametersDependsOn.filter(
      resource => projectMeta?.function?.[`${resource.resourceName}`]?.service !== ServiceName.LambdaLayer,
    );
    updatedDependsOn = currentDependsOn.concat(prevDependsOnExcludingLayers);
  }
  return updatedDependsOn;
};
