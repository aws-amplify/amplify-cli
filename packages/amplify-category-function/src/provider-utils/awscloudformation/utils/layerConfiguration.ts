import { $TSAny, JSONUtilities, pathManager, recursiveOmit, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import * as path from 'path';
import { ephemeralField, deleteVersionsField, layerConfigurationFileName, updateVersionPermissionsField } from './constants';
import { categoryName } from '../../../constants';
import { LayerParameters, LayerPermission, LayerRuntime, PermissionEnum } from './layerParams';

export type LayerConfiguration = Pick<LayerParameters, 'permissions' | 'runtimes' | 'description'>;

export function createLayerConfiguration(layerDirPath: string, parameters: LayerConfiguration) {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  parameters.runtimes = toStoredRuntimeMetadata(parameters.runtimes);
  JSONUtilities.writeJson(layerConfigFilePath, parameters);
}

export function getLayerConfiguration(layerName: string) {
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(layerName);
  const cloudTemplateValues = loadLayerCloudTemplateRuntimes(layerName);
  layerConfig.runtimes.forEach(runtimeMeta => {
    runtimeMeta.cloudTemplateValues = cloudTemplateValues.filter((ctv: string) => ctv.startsWith(runtimeMeta.value));
  });
  layerConfig.description = getLayerDescription(layerName);
  return layerConfig;
}

export function getLayerRuntimes(layerName: string) {
  return getLayerConfiguration(layerName).runtimes;
}

export function saveLayerRuntimes(layerDirPath: string, runtimes: LayerRuntime[] = []) {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  layerConfig.runtimes = toStoredRuntimeMetadata(runtimes);
  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

export function getLayerVersionsToBeRemovedByCfn(layerName: string, envName: string): number[] {
  const layerConfig = loadLayerConfigurationFile(layerName);
  return _.get<number[]>(layerConfig, [ephemeralField, deleteVersionsField, envName], []);
}

export function deleteLayerVersionsToBeRemovedByCfn(layerName: string, envName: string) {
  const layerConfig = loadLayerConfigurationFile(layerName);
  recursiveOmit(layerConfig, [ephemeralField, deleteVersionsField, envName]);
  writeLayerConfigurationFile(layerName, layerConfig);
}

export function saveLayerVersionsToBeRemovedByCfn(layerName: string, skipVersions: number[], envName: string) {
  const layerConfig = loadLayerConfigurationFile(layerName);
  _.set(layerConfig, [ephemeralField, deleteVersionsField, envName], skipVersions);
  writeLayerConfigurationFile(layerName, layerConfig);
}

export function saveLayerVersionPermissionsToBeUpdatedInCfn(
  layerName: string,
  envName: string,
  version: number,
  permissions: LayerPermission[],
) {
  const layerConfig = loadLayerConfigurationFile(layerName);
  _.setWith(layerConfig, [ephemeralField, updateVersionPermissionsField, envName, version.toString()], permissions, Object);
  writeLayerConfigurationFile(layerName, layerConfig);
}

export function getLayerVersionPermissionsToBeUpdatedInCfn(layerName: string, envName: string, version: number): LayerPermission[] {
  const layerConfig = loadLayerConfigurationFile(layerName);
  return _.get<LayerPermission[]>(layerConfig, [ephemeralField, updateVersionPermissionsField, envName, version.toString()], undefined);
}

export function deleteLayerVersionPermissionsToBeUpdatedInCfn(layerName: string, envName: string) {
  const layerConfig = loadLayerConfigurationFile(layerName);
  recursiveOmit(layerConfig, [ephemeralField, updateVersionPermissionsField, envName]);
  writeLayerConfigurationFile(layerName, layerConfig);
}

export function saveLayerPermissions(layerDirPath: string, permissions: LayerPermission[] = [{ type: PermissionEnum.Private }]): boolean {
  const layerConfigFilePath = path.join(layerDirPath, layerConfigurationFileName);
  const layerConfig = JSONUtilities.readJson<$TSAny>(layerConfigFilePath);
  let updated = false;

  if (!_.isEqual(layerConfig.permissions, permissions)) {
    layerConfig.permissions = permissions;
    JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
    updated = true;
  }

  return updated;
}

function getLayerDescription(layerName: string): string {
  const { description } = stateManager.getResourceParametersJson(undefined, categoryName, layerName);
  return description;
}

export function loadLayerConfigurationFile(layerName: string, throwIfNotExist = true) {
  const layerConfigFilePath = path.join(
    pathManager.getResourceDirectoryPath(undefined, categoryName, layerName),
    layerConfigurationFileName,
  );

  return JSONUtilities.readJson<$TSAny>(layerConfigFilePath, { throwIfNotExist });
}

export function writeLayerConfigurationFile(layerName: string, layerConfig: $TSAny) {
  const layerConfigFilePath = path.join(
    pathManager.getResourceDirectoryPath(undefined, categoryName, layerName),
    layerConfigurationFileName,
  );

  JSONUtilities.writeJson(layerConfigFilePath, layerConfig);
}

function loadLayerCloudTemplateRuntimes(layerName: string): string[] {
  const { runtimes } = stateManager.getResourceParametersJson(undefined, categoryName, layerName) || [];
  return runtimes;
}

function toStoredRuntimeMetadata(runtimes: LayerRuntime[]) {
  return runtimes.map(runtime => _.pick(runtime, 'value', 'name', 'runtimePluginId', 'layerExecutablePath'));
}
