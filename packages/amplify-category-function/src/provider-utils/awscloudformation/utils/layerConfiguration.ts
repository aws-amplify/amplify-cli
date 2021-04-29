import { $TSAny, JSONUtilities, pathManager, recursiveOmit, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import path from 'path';
import { categoryName, skipVersionsField, ephemeralField } from './constants';
import { LayerParameters, LayerPermission, LayerRuntime, PermissionEnum } from './layerParams';

export type LayerConfiguration = Pick<LayerParameters, 'permissions' | 'runtimes' | 'description'>;
const layerConfigurationFileName = 'layer-configuration.json';

export function createLayerConfiguration(layerDirPath: string, parameters: LayerConfiguration) {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  parameters.runtimes = toStoredRuntimeMetadata(parameters.runtimes);
  JSONUtilities.writeJson(layerConfigFilePath, parameters);
}

export function getLayerConfiguration(backendDirPath: string, layerName: string) {
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(backendDirPath, layerName);
  const cloudTemplateValues = loadLayerCloudTemplateRuntimes(layerName);
  layerConfig.runtimes.forEach(runtimeMeta => {
    runtimeMeta.cloudTemplateValues = cloudTemplateValues.filter((ctv: string) => ctv.startsWith(runtimeMeta.value));
  });
  layerConfig.description = getLayerDescription(layerName);
  return layerConfig;
}

export function getLayerRuntimes(backendDirPath: string, layerName: string) {
  return getLayerConfiguration(backendDirPath, layerName).runtimes;
}

export function saveLayerRuntimes(layerDirPath: string, runtimes: LayerRuntime[] = []) {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  layerConfig.runtimes = toStoredRuntimeMetadata(runtimes);
  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

export function getLayerVersionToBeRemovedByCfn(layerName: string, envName: string): number[] {
  const layerConfigFilePath = getLayerDirPath(layerName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  return _.get<number[]>(layerConfig, [ephemeralField, skipVersionsField, envName], []);
}

export function deleteLayerVersionToBeRemovedByCfn(layerName: string, envName: string) {
  const layerConfigFilePath = getLayerDirPath(layerName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  recursiveOmit(layerConfig, [ephemeralField, skipVersionsField, envName]);
  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

export function saveLayerVersionToBeRemovedByCfn(layerName: string, skipVersions: number[], envName: string) {
  const layerConfigFilePath = getLayerDirPath(layerName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  _.set(layerConfig, [ephemeralField, skipVersionsField, envName], skipVersions);
  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

export function saveLayerPermissions(layerDirPath: string, permissions: LayerPermission[] = [{ type: PermissionEnum.Private }]) {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  layerConfig.permissions = permissions;
  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

export function saveLayerDescription(layerName: string, description?: string) {
  const layerConfig = stateManager.getResourceParametersJson(undefined, categoryName, layerName);
  stateManager.setResourceParametersJson(undefined, categoryName, layerName, {
    ...layerConfig,
    description,
  });
}
function getLayerDescription(layerName: string): string {
  const { description } = stateManager.getResourceParametersJson(undefined, categoryName, layerName);
  return description;
}
function getLayerDirPath(layerName: string): string {
  const backendDirPath = pathManager.getBackendDirPath();
  const layerConfigFilePath = path.join(backendDirPath, categoryName, layerName, layerConfigurationFileName);
  return layerConfigFilePath;
}

export function loadLayerConfigurationFile(backendDirPath: string, layerName: string) {
  const layerConfigFilePath = path.join(backendDirPath, categoryName, layerName, layerConfigurationFileName);
  return JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
}

function loadLayerCloudTemplateRuntimes(layerName: string): string[] {
  const { runtimes } = stateManager.getResourceParametersJson(undefined, categoryName, layerName) || [];
  return runtimes;
}

function toStoredRuntimeMetadata(runtimes: LayerRuntime[]) {
  return runtimes.map(runtime => _.pick(runtime, 'value', 'name', 'runtimePluginId', 'layerExecutablePath'));
}
