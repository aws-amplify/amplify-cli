import * as path from 'path';
import * as fs from 'fs-extra';
import { readJsonFile } from 'amplify-e2e-core';

export function verifyPlugin(pluginDirPath: string): boolean {
  console.log('pluginDirPath', pluginDirPath);

  if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
    return verifyNodePackage(pluginDirPath);
  }
  return false;
}

function verifyNodePackage(pluginDirPath: string): boolean {
  const pluginPackageJsonFilePath = path.join(pluginDirPath, 'package.json');

  if (!fs.existsSync(pluginPackageJsonFilePath) || !fs.statSync(pluginPackageJsonFilePath).isFile()) {
    return false;
  }

  try {
    fs.readFileSync(pluginPackageJsonFilePath); //package.json needs to be valid json file
    const pluginModule = require(pluginDirPath);
    return verifyAmplifyManifest(pluginDirPath, pluginModule);
  } catch (err) {
    return false;
  }
}

function verifyAmplifyManifest(pluginDirPath: string, pluginModule: any): boolean {
  const pluginManifestFilePath = path.join(pluginDirPath, 'amplify-plugin.json');
  if (!fs.existsSync(pluginManifestFilePath) || !fs.statSync(pluginManifestFilePath).isFile()) {
    return false;
  }

  try {
    const manifest = readJsonFile(pluginManifestFilePath);
    return verifyEventHandlers(manifest, pluginModule);
  } catch (err) {
    false;
  }
}

function verifyEventHandlers(manifest: any, pluginModule: any): boolean {
  let isVerified = true;

  if (manifest.eventHandlers && manifest.eventHandlers.length > 0) {
    isVerified = pluginModule.hasOwnProperty('handleAmplifyEvent') && typeof pluginModule['handleAmplifyEvent'] === 'function';
  }
  return isVerified;
}
