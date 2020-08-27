import _ from 'lodash';
import path from 'path';
import { JSONUtilities } from 'amplify-cli-core';
import { categoryName } from './constants';

import { LayerRuntime } from './layerParams';

const runtimesFileName = 'layer-runtimes.json';

export const getLayerRuntimes = (backendDirPath: string, layerName: string) => {
  const runtimesFilePath = path.join(backendDirPath, categoryName, layerName, runtimesFileName);
  return JSONUtilities.readJson(runtimesFilePath) as any;
};

export const saveLayerRuntimes = (layerDirPath: string, layerName: string, runtimes: LayerRuntime[]) => {
  const runtimesFilePath = path.join(layerDirPath, runtimesFileName);

  runtimes = (runtimes || []).map(runtime => _.pick(runtime, 'value', 'name', 'layerExecutablePath', 'cloudTemplateValue'));

  JSONUtilities.writeJson(runtimesFilePath, runtimes);
};

// function createRuntimesFile(runtimesFilePath: string, runtimes: LayerRuntime[]): void {
//   JSONUtilities.writeJson(runtimesFilePath, runtimes);
// }

// function readRuntimesFile(runtimesFilePath: string): LayerRuntime[] {
//   return JSONUtilities.readJson(runtimesFilePath) as any;
// }
