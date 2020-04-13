import { nspawn as spawn, KEY_DOWN_ARROW } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';
import { readPluginsJsonFile, writePluginsJsonFile } from './pluginPlatformHelper';
import { write } from 'fs-extra';

export async function addPlugDirectory(cwd: string, pluginScanDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'configure'], { cwd, stripColors: true })
      .wait('Select the following options to configure')
      .sendCarriageReturn()
      .wait('Select the action on the directory list')
      .sendCarriageReturn()
      .wait('Enter the full path of the plugin scan directory you want to add')
      .send(pluginScanDir)
      .sendCarriageReturn()
      .wait('Select the following options to configure')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function verifyPluginDirectoryAdded(pluginScanDir: string): boolean {
  const pluginPlatform = readPluginsJsonFile();
  return pluginPlatform.pluginDirectories.includes(pluginScanDir);
}

export function removePlugDirectory(cwd: string, pluginScanDir: string): Promise<void> {
  const pluginPlatform = readPluginsJsonFile();
  pluginPlatform.pluginDirectories = pluginPlatform.pluginDirectories.filter(dir => {
    return dir !== pluginScanDir;
  });
  writePluginsJsonFile(pluginPlatform);
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true }).run(function(err: Error) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export async function addPlugPrefix(cwd: string, prefix: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'configure'], { cwd, stripColors: true })
      .wait('Select the following options to configure')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the action on the prefix list')
      .sendCarriageReturn()
      .wait('Enter the new prefix')
      .send(prefix)
      .sendCarriageReturn()
      .wait('Select the following options to configure')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function verifyPluginPrefixAdded(pluginPrefix: string): boolean {
  const pluginPlatform = readPluginsJsonFile();
  return pluginPlatform.pluginPrefixes.includes(pluginPrefix);
}

export async function removePlugPrefix(cwd: string, pluginPrefix: string): Promise<void> {
  const pluginPlatform = readPluginsJsonFile();
  pluginPlatform.pluginPrefixes = pluginPlatform.pluginPrefixes.filter(prefix => {
    return prefix !== pluginPrefix;
  });
  writePluginsJsonFile(pluginPlatform);
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true }).run(function(err: Error) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export async function addCustomPlugin(cwd: string, pluginDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'add'], { cwd, stripColors: true })
      .wait('Enter the absolute path for the root of the plugin directory')
      .sendLine(pluginDir)
      .wait('Run a fresh scan for plugins on the Amplify CLI pluggable platform')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function verifyCustomPluginAdded(pluginDir: string): boolean {
  const pluginPlatform = readPluginsJsonFile();
  return pluginPlatform.userAddedLocations.includes(pluginDir);
}

export async function removeCustomPlugin(cwd: string, pluginDir: string): Promise<void> {
  const pluginPlatform = readPluginsJsonFile();
  pluginPlatform.userAddedLocations = pluginPlatform.userAddedLocations.filter(dir => {
    return dir !== pluginDir;
  });
  writePluginsJsonFile(pluginPlatform);
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true }).run(function(err: Error) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function verifyPluginPlatformSetup(): boolean {
  const pluginPlatform = readPluginsJsonFile();
  return (
    pluginPlatform &&
    pluginPlatform.pluginDirectories &&
    pluginPlatform.pluginDirectories.length > 0 &&
    pluginPlatform.pluginPrefixes &&
    pluginPlatform.pluginPrefixes.length > 0 &&
    pluginPlatform.plugins &&
    pluginPlatform.plugins.core
  );
}
