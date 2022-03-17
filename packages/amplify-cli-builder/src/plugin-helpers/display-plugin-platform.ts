import util from 'util';
import { Context } from '../domain/context';
import { PluginInfo } from '../domain/plugin-info';
import { PluginCollection } from '../domain/plugin-collection';
import { PluginPlatform } from '../domain/plugin-platform';

const defaultIndentationStr = '  ';

export function displaySimpleString(context: Context, title: string, contents: string, indentation: number = 0) {
  const indentationStr = createIndentation(indentation);
  context.print.blue(`${indentationStr}${title}:`);
  context.print.info(`${indentationStr}${defaultIndentationStr}${contents}`);
}

export function displayStringArray(context: Context, title: string, contents: string[], indentation: number = 0) {
  const indentationStr = createIndentation(indentation);
  context.print.blue(`${indentationStr}${title}:`);
  contents.forEach(strItem => {
    context.print.info(`${indentationStr}${defaultIndentationStr}${strItem}`);
  });
}

export function displayPluginDirectories(context: Context, pluginPlatform: PluginPlatform) {
  context.print.info('');
  displayStringArray(context, 'Directories where the CLI scans for plugins:', pluginPlatform.pluginDirectories);
  context.print.info('');
}

export function displayPrefixes(context: Context, pluginPlatform: PluginPlatform) {
  context.print.info('');
  displayStringArray(context, 'Plugin name prefixes for the CLI to search for:', pluginPlatform.pluginPrefixes);
  context.print.info('');
}

export function displayScanInterval(context: Context, pluginPlatform: PluginPlatform) {
  context.print.info('');
  displaySimpleString(context, 'Automatic plugin scan interval in seconds', pluginPlatform.maxScanIntervalInSeconds.toString());
  context.print.info('');
}

export function displayConfiguration(context: Context, pluginPlatform: PluginPlatform) {
  context.print.info('');
  displayStringArray(context, 'Directories for plugin scan', pluginPlatform.pluginDirectories);
  displayStringArray(context, 'Prefixes for plugin scan', pluginPlatform.pluginPrefixes);
  displaySimpleString(context, 'Automatic plugin scan interval in seconds', pluginPlatform.maxScanIntervalInSeconds.toString());
  context.print.info('');
}

export function displayGeneralInfo(context: Context, pluginPlatform: PluginPlatform) {
  context.print.info('');
  displayStringArray(context, 'Directories for plugin scan', pluginPlatform.pluginDirectories);
  displayStringArray(context, 'Prefixes for plugin scan', pluginPlatform.pluginPrefixes);
  displayStringArray(context, 'Manually added plugins', pluginPlatform.userAddedLocations);
  displaySimpleString(context, 'Automatic plugin scan interval in seconds', pluginPlatform.maxScanIntervalInSeconds.toString());
  displaySimpleString(context, 'Last scan time stamp', pluginPlatform.lastScanTime.toString());
  context.print.info('');
}

export function displayPluginPlatform(context: Context, pluginPlatform: PluginPlatform) {
  displayGeneralInfo(context, pluginPlatform);
  displayPluginCollection(context, pluginPlatform.plugins, 'active plugin');
  displayPluginCollection(context, pluginPlatform.excluded, 'excluded plugin');
}

export function displayPluginCollection(context: Context, pluginCollection: PluginCollection, group: string = '') {
  Object.keys(pluginCollection).forEach(key => {
    displayPluginInfoArray(context, pluginCollection[key], group);
  });
}

export function displayPluginInfoArray(context: Context, pluginInfoArray: Array<PluginInfo>, group: string = '') {
  pluginInfoArray.forEach(pluginInfo => {
    displayPluginInfo(context, pluginInfo, group);
  });
}

export function displayPluginInfo(context: Context, pluginInfo: PluginInfo, group: string = '') {
  const { manifest, packageName, packageVersion } = pluginInfo;
  const title = `${manifest.name}: ${packageName}@${packageVersion}`;
  context.print.info('');
  if (group.length > 0) {
    context.print.red(group);
  }
  context.print.blue(title);
  context.print.info(util.inspect(pluginInfo, undefined, Infinity));
  context.print.info('');
}

export function createIndentation(spaceCount: number): string {
  if (spaceCount === 0) {
    return '';
  }
  let charArray = [' '];
  // tslint:disable-next-line
  while (charArray.length * 2 <= spaceCount) {
    charArray = charArray.concat(charArray);
  }
  if (charArray.length < spaceCount) {
    charArray = charArray.concat(charArray.slice(0, spaceCount - charArray.length));
  }
  return charArray.join('');
}
