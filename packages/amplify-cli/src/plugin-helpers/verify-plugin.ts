import * as path from 'path';
import * as fs from 'fs-extra';
import {
  PluginManifest,
  constants,
  JSONUtilities,
  $TSAny,
  PluginVerificationResult,
  PluginVerificationError,
} from '@aws-amplify/amplify-cli-core';

type VerificationContext = {
  pluginDirPath: string;
  manifest?: PluginManifest;
  pluginModule?: {
    handleAmplifyEvent: string;
  };
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
  const corePluginJson = JSONUtilities.readJson<$TSAny>(path.normalize(path.join(__dirname, '..', '..', 'amplify-plugin.json')));
  if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
    result.isValid = false;
    result.message = 'Amplify CLI core command names can not be used as plugin name';
  }
  return result;
}

async function verifyNodePackage(pluginDirPath: string): Promise<PluginVerificationResult> {
  const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
  try {
    const packageJson = JSONUtilities.readJson(pluginPackageJsonFilePath);
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
    const manifest = JSONUtilities.readJson<PluginManifest>(pluginManifestFilePath)!;
    const pluginNameValidationResult = await validPluginName(manifest.name);

    if (pluginNameValidationResult.isValid) {
      context.manifest = manifest;

      let result = verifyCommands();

      result = result.verified ? await verifyEventHandlers(context) : result;
      result.manifest = manifest;

      return result;
    }

    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, err);
  }
}

function verifyCommands(): PluginVerificationResult {
  //   let isVerified = true;
  //   if (manifest.commands && manifest.commands.length > 0) {
  //     isVerified = pluginModule.hasOwnProperty(constants.EXECUTE_AMPLIFY_COMMAND) &&
  //         typeof pluginModule[constants.EXECUTE_AMPLIFY_COMMAND] === 'function';
  //   }

  //   if (isVerified) {
  //     return new PluginVerificationResult(true);
  //   }
  //   return new PluginVerificationResult(
  //             false,
  //             PluginVerificationError.MissingExecuteAmplifyCommandMethod,
  //         );

  // verification should be on the plugin type and if it implements all the required METHODS;
  return new PluginVerificationResult(true);
}

async function verifyEventHandlers(context: VerificationContext): Promise<PluginVerificationResult> {
  let isVerified = true;
  if (context.manifest!.eventHandlers && context.manifest!.eventHandlers.length > 0) {
    // Lazy load the plugin if not yet loaded
    if (!context.pluginModule) {
      context.pluginModule = await import(context.pluginDirPath);
    }

    isVerified =
      Object.prototype.hasOwnProperty.call(context.pluginModule, constants.HANDLE_AMPLIFY_EVENT) &&
      typeof context.pluginModule?.[constants.HANDLE_AMPLIFY_EVENT] === 'function';
  }

  if (isVerified) {
    return new PluginVerificationResult(true);
  }
  return new PluginVerificationResult(false, PluginVerificationError.MissingHandleAmplifyEventMethod);
}
