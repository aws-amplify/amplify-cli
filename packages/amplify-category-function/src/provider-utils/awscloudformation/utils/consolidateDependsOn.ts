import { $TSObject } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import { category } from '../../../constants';
import { lambdaLayerSetting, resourceAccessSetting, ServiceName } from './constants';

export const consolidateDependsOnForLambda = (
  projectMeta: $TSObject,
  currentDependsOn: FunctionDependency[],
  lambdaToUpdate: string,
  selectedSettings: string[],
): FunctionDependency[] => {
  let updatedDependsOn: FunctionDependency[];
  const prevFunctionParametersDependsOn: FunctionDependency[] = _.get(projectMeta, ['function', lambdaToUpdate, 'dependsOn'], []);
  if (selectedSettings.includes(resourceAccessSetting)) {
    // insert old lambdaLayer dependsOn if present
    const prevLayersDependsOn: FunctionDependency[] = prevFunctionParametersDependsOn.filter(
      resource => _.get(projectMeta, [category, resource.resourceName, 'service'], []) === ServiceName.LambdaLayer,
    );
    updatedDependsOn = currentDependsOn.concat(prevLayersDependsOn);
  }
  if (selectedSettings.includes(lambdaLayerSetting)) {
    //  insert resource dependsOn
    const prevLayersDependsOn: FunctionDependency[] = prevFunctionParametersDependsOn.filter(
      resource => _.get(projectMeta, [category, resource.resourceName, 'service'], []) !== ServiceName.LambdaLayer,
    );
    updatedDependsOn = currentDependsOn.concat(prevLayersDependsOn);
  }
  return updatedDependsOn;
};
