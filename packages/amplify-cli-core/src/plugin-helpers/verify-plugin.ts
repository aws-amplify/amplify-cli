import path from 'path';
import fs  from 'fs-extra';
import constants from '../domain/constants';
import readJsonFile from '../utils/readJsonFile';
import PluginManifest from '../domain/plugin-manifest';
import PluginVerificationResult, { PluginVerificationError } from '../domain/plugin-verification-result';
import { AmplifyEvent } from '../domain/amplify-event';

export function verifyPlugin(pluginDirPath: string): PluginVerificationResult {
    if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
        return verifyNodePackage(pluginDirPath);
    } else {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.PluginDirPathNotExist
        );
    }
}

function verifyNodePackage(pluginDirPath: string): PluginVerificationResult {
    const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
    try {
        const packageJson = readJsonFile(pluginPackageJsonFilePath);
        const pluginModule = require(pluginDirPath);
        const result = verifyAmplifyManifest(pluginDirPath, pluginModule);
        result.packageJson = packageJson;
        return result;
    } catch (err) {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.InvalidNodePackage,
            err
        );
    }
}

function verifyAmplifyManifest(pluginDirPath: string, pluginModule: any): PluginVerificationResult {
    const pluginManifestFilePath = path.join(pluginDirPath, constants.MANIFEST_FILE_NAME);
    if (!fs.existsSync(pluginManifestFilePath) || !fs.statSync(pluginManifestFilePath).isFile()) {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.MissingManifest
        );
    }

    try {
        const manifest = readJsonFile(pluginManifestFilePath) as PluginManifest;
        const result = verifyCommands(manifest, pluginModule);
        result.manifest = manifest;
        return result;
    } catch (err) {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.InvalidManifest,
            err
        );
    }
}

function verifyCommands(manifest: PluginManifest, pluginModule: any): PluginVerificationResult {
    let isVerified = true;
    if (manifest.commands && manifest.commands.length > 0) {
        isVerified = pluginModule.hasOwnProperty(constants.ExecuteAmplifyCommand) &&
        typeof pluginModule[constants.ExecuteAmplifyCommand] === 'function';
    }

    if (isVerified) {
        return verifySubscriptions(manifest, pluginModule);
    } else {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.MissingExecuteAmplifyCommandMethod
        );
    }
}

function verifySubscriptions(manifest: PluginManifest, pluginModule: any): PluginVerificationResult {
    let isVerified = true;
    if (manifest.subscriptions && manifest.subscriptions.length > 0) {
        isVerified = pluginModule.hasOwnProperty(constants.HandleAmplifyEvent) &&
        typeof pluginModule[constants.HandleAmplifyEvent] === 'function';
    }

    if (isVerified) {
        return new PluginVerificationResult(true);
    } else {
        return new PluginVerificationResult(
            false,
            PluginVerificationError.MissingHandleAmplifyEventMethod
        );
    }
}