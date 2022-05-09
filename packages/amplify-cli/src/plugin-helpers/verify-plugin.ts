import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { constants } from '../domain/constants';
import { PluginManifest } from '../domain/plugin-manifest';
import { PluginVerificationError, PluginVerificationResult } from '../domain/plugin-verification-result';

type VerificationContext = {
  pluginDirPath: string;
  manifest?: PluginManifest;
  pluginModule?: $TSAny;
};

/**
 * Verify plugin is configured correctly
 */
export const verifyPlugin = async (pluginDirPath: string): Promise<PluginVerificationResult> => {
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
};

/**
 * PluginNameValidationResult type
 */
export type PluginNameValidationResult = {
  isValid: boolean;
  message?: string;
};

/**
 * Ensure no naming conflict exists between custom plugins and Amplify CLI core plugins
 */
export const validPluginName = async (pluginName: string): Promise<PluginNameValidationResult> => {
  const result: PluginNameValidationResult = {
    isValid: true,
  };
  const corePluginJson = JSONUtilities.readJson<$TSAny>(path.normalize(path.join(__dirname, '..', '..', 'amplify-plugin.json')));
  if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
    result.isValid = false;
    result.message = 'Amplify CLI core command names can not be used as plugin name';
  }
  return result;
};

const verifyNodePackage = async (pluginDirPath: string): Promise<PluginVerificationResult> => {
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
};

const verifyAmplifyManifest = async (context: VerificationContext): Promise<PluginVerificationResult> => {
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

      const pluginVerificationResult = await verifyEventHandlers(context);
      pluginVerificationResult.manifest = manifest;

      return pluginVerificationResult;
    }

    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
  } catch (err) {
    return new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, err);
  }
};

const verifyEventHandlers = async (context: VerificationContext): Promise<PluginVerificationResult> => {
  let isVerified = true;
  if (context.manifest!.eventHandlers && context.manifest!.eventHandlers.length > 0) {
    // Lazy load the plugin if not yet loaded
    if (!context.pluginModule) {
      context.pluginModule = await import(context.pluginDirPath);
    }

    isVerified = context.pluginModule?.[constants.HandleAmplifyEvent]
      && typeof context.pluginModule[constants.HandleAmplifyEvent] === 'function';
  }

  if (isVerified) {
    return new PluginVerificationResult(true);
  }
  return new PluginVerificationResult(false, PluginVerificationError.MissingHandleAmplifyEventMethod);
};
