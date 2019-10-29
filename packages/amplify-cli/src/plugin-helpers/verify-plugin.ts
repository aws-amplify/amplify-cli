import path from 'path';
import fs from 'fs-extra';
import { constants } from '../domain/constants';
import { readJsonFileSync, readJsonFile } from '../utils/readJsonFile';
import { PluginManifest } from '../domain/plugin-manifest';
import { PluginVerificationResult, PluginVerificationError } from '../domain/plugin-verification-result';

export function verifyPluginSync(pluginDirPath: string): PluginVerificationResult {
  if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
    return verifyNodePackageSync(pluginDirPath);
  }
  return new PluginVerificationResult(false, PluginVerificationError.PluginDirPathNotExist);
}

export async function verifyPlugin(pluginDirPath: string): Promise<PluginVerificationResult> {
  let exists = await fs.pathExists(pluginDirPath);
  if (exists) {
    const stat = await fs.stat(pluginDirPath);
    if (!stat.isDirectory()) {
      exists = false;
    }
  }
  if (exists) {
    return verifyNodePackage(pluginDirPath);
  }
  return new PluginVerificationResult(false, PluginVerificationError.PluginDirPathNotExist);
}

export type PluginNameValidationResult = {
  isValid: boolean;
  message?: string;
};

export function validPluginNameSync(pluginName: string): PluginNameValidationResult {
  const result: PluginNameValidationResult = {
    isValid: true,
  };
  const corePluginJson = readJsonFileSync(path.normalize(path.join(__dirname, '../../amplify-plugin.json')));
  if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
    result.isValid = false;
    result.message = 'Amplify CLI core comand names can not be used as plugin name';
  }
  return result;
}

export async function validPluginName(pluginName: string): Promise<PluginNameValidationResult> {
  const result: PluginNameValidationResult = {
    isValid: true,
  };
  const corePluginJson = await readJsonFile(path.normalize(path.join(__dirname, '../../amplify-plugin.json')));
  if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
    result.isValid = false;
    result.message = 'Amplify CLI core comand names can not be used as plugin name';
  }
  return result;
}

function verifyNodePackageSync(pluginDirPath: string): PluginVerificationResult {
  const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
  try {
    const packageJson = readJsonFileSync(pluginPackageJsonFilePath);
    const pluginModule = require(pluginDirPath);
    const result = verifyAmplifyManifestSync(pluginDirPath, pluginModule);
    result.packageJson = packageJson;
    return result;
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidNodePackage, err);
  }
}

async function verifyNodePackage(pluginDirPath: string): Promise<PluginVerificationResult> {
  const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
  try {
    const packageJson = await readJsonFile(pluginPackageJsonFilePath);
    const pluginModule = require(pluginDirPath);
    const result = await verifyAmplifyManifest(pluginDirPath, pluginModule);
    result.packageJson = packageJson;
    return result;
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidNodePackage, err);
  }
}

function verifyAmplifyManifestSync(pluginDirPath: string, pluginModule: any): PluginVerificationResult {
  const pluginManifestFilePath = path.join(pluginDirPath, constants.MANIFEST_FILE_NAME);
  if (!fs.existsSync(pluginManifestFilePath) || !fs.statSync(pluginManifestFilePath).isFile()) {
    return new PluginVerificationResult(false, PluginVerificationError.MissingManifest);
  }

  try {
    const manifest = readJsonFileSync(pluginManifestFilePath) as PluginManifest;
    const pluginNameValidationResult = validPluginNameSync(manifest.name);
    if (pluginNameValidationResult.isValid) {
      let result = verifyCommands(manifest, pluginModule);
      result = result.verified ? verifyEventHandlers(manifest, pluginModule) : result;
      result.manifest = manifest;
      return result;
    }
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, err);
  }
}

async function verifyAmplifyManifest(pluginDirPath: string, pluginModule: any): Promise<PluginVerificationResult> {
  const pluginManifestFilePath = path.join(pluginDirPath, constants.MANIFEST_FILE_NAME);
  let exists = await fs.pathExists(pluginManifestFilePath);
  if (exists) {
    const stat = await fs.stat(pluginManifestFilePath);
    exists = stat.isFile();
  }
  if (!exists) {
    return new PluginVerificationResult(false, PluginVerificationError.MissingManifest);
  }

  try {
    const manifest = (await readJsonFile(pluginManifestFilePath)) as PluginManifest;
    const pluginNameValidationResult = await validPluginName(manifest.name);
    if (pluginNameValidationResult.isValid) {
      let result = verifyCommands(manifest, pluginModule);
      result = result.verified ? verifyEventHandlers(manifest, pluginModule) : result;
      result.manifest = manifest;
      return result;
    }
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, err);
  }
}

function verifyCommands(manifest: PluginManifest, pluginModule: any): PluginVerificationResult {
  //   let isVerified = true;
  //   if (manifest.commands && manifest.commands.length > 0) {
  //     isVerified = pluginModule.hasOwnProperty(constants.ExecuteAmplifyCommand) &&
  //         typeof pluginModule[constants.ExecuteAmplifyCommand] === 'function';
  //   }

  //   if (isVerified) {
  //     return new PluginVerificationResult(true);
  //   }
  //   return new PluginVerificationResult(
  //             false,
  //             PluginVerificationError.MissingExecuteAmplifyCommandMethod,
  //         );

  // verification should be on the plugin type and if it implement all the required METHODS;
  return new PluginVerificationResult(true);
}

function verifyEventHandlers(manifest: PluginManifest, pluginModule: any): PluginVerificationResult {
  let isVerified = true;
  if (manifest.eventHandlers && manifest.eventHandlers.length > 0) {
    isVerified =
      pluginModule.hasOwnProperty(constants.HandleAmplifyEvent) && typeof pluginModule[constants.HandleAmplifyEvent] === 'function';
  }

  if (isVerified) {
    return new PluginVerificationResult(true);
  }
  return new PluginVerificationResult(false, PluginVerificationError.MissingHandleAmplifyEventMethod);
}
