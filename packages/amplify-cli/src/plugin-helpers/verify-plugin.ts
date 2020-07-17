import path from 'path';
import fs from 'fs-extra';
import { constants } from '../domain/constants';
import { readJsonFile } from '../utils/readJsonFile';
import { PluginManifest } from '../domain/plugin-manifest';
import { PluginVerificationResult, PluginVerificationError } from '../domain/plugin-verification-result';

type VerificationContext = {
  pluginDirPath: string;
  manifest?: PluginManifest;
  pluginModule?: any;
};

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

export async function validPluginName(pluginName: string): Promise<PluginNameValidationResult> {
  const result: PluginNameValidationResult = {
    isValid: true,
  };
  const corePluginJson = await readJsonFile(path.normalize(path.join(__dirname, '../../amplify-plugin.json')));
  if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
    result.isValid = false;
    result.message = 'Amplify CLI core command names can not be used as plugin name';
  }
  return result;
}

async function verifyNodePackage(pluginDirPath: string): Promise<PluginVerificationResult> {
  const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
  try {
    const packageJson = await readJsonFile(pluginPackageJsonFilePath);
    const context: VerificationContext = {
      pluginDirPath,
    };
    const result = await verifyAmplifyManifest(context);
    result.packageJson = packageJson;
    return result;
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidNodePackage, err);
  }
}

async function verifyAmplifyManifest(context: VerificationContext): Promise<PluginVerificationResult> {
  const pluginManifestFilePath = path.join(context.pluginDirPath, constants.MANIFEST_FILE_NAME);
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
      context.manifest = manifest;

      let result = verifyCommands(context);
      result = result.verified ? verifyEventHandlers(context) : result;
      result.manifest = manifest;
      return result;
    }
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, err);
  }
}

function verifyCommands(context: VerificationContext): PluginVerificationResult {
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

function verifyEventHandlers(context: VerificationContext): PluginVerificationResult {
  let isVerified = true;
  if (context.manifest!.eventHandlers && context.manifest!.eventHandlers.length > 0) {
    // Lazy load the plugin if not yet loaded
    if (!context.pluginModule) {
      context.pluginModule = require(context.pluginDirPath);
    }

    isVerified =
      context.pluginModule.hasOwnProperty(constants.HandleAmplifyEvent) &&
      typeof context.pluginModule[constants.HandleAmplifyEvent] === 'function';
  }

  if (isVerified) {
    return new PluginVerificationResult(true);
  }
  return new PluginVerificationResult(false, PluginVerificationError.MissingHandleAmplifyEventMethod);
}
