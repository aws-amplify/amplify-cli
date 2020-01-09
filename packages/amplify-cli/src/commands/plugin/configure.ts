import fs from 'fs-extra';
import os from 'os';
import { Context } from '../../domain/context';
import { PluginPlatform } from '../../domain/plugin-platform';
import inquirer from '../../domain/inquirer-helper';
import { constants } from '../../domain/constants';
import { writePluginsJsonFileSync } from '../../plugin-helpers/access-plugins-file';
import { normalizePluginDirectory } from '../../plugin-helpers/scan-plugin-platform';
import { scan } from '../../plugin-manager';
import {
  displayPluginDirectories,
  displayPrefixes,
  displayScanInterval,
  displayConfiguration,
} from '../../plugin-helpers/display-plugin-platform';

const MINPREFIXLENGTH = 2;
const MAXPREFIXLENGTH = 20;

export async function run(context: Context): Promise<PluginPlatform> {
  const { pluginPlatform } = context;
  const pluginDirectories = 'scannable plugin directories';
  const pluginPrefixes = 'scannable plugin prefixes';
  const maxScanIntervalInSeconds = 'max CLI scan interval in seconds';
  const exit = 'save & exit';

  const options = [pluginDirectories, pluginPrefixes, maxScanIntervalInSeconds, exit];

  let answer: any;

  do {
    answer = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select the following options to configure',
      choices: options,
    });

    switch (answer.selection) {
      case pluginDirectories:
        await configurePluginDirectories(context, pluginPlatform);
        break;
      case pluginPrefixes:
        await configurePrefixes(context, pluginPlatform);
        break;
      case maxScanIntervalInSeconds:
        await configureScanInterval(context, pluginPlatform);
        break;
      default:
        configurePluginDirectories(context, pluginPlatform);
        break;
    }
  } while (answer.selection !== exit);

  writePluginsJsonFileSync(pluginPlatform);

  return scan(pluginPlatform);
}

async function configurePluginDirectories(context: Context, pluginPlatform: PluginPlatform) {
  displayPluginDirectories(context, pluginPlatform);

  const ADD = 'add';
  const REMOVE = 'remove';
  const EXIT = 'exit';
  const LEARNMORE = 'Learn more';

  const actionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Select the action on the directory list',
    choices: [ADD, REMOVE, EXIT, LEARNMORE],
  });

  if (actionAnswer.action === ADD) {
    await addPluginDirectory(pluginPlatform);
  } else if (actionAnswer.action === REMOVE) {
    await removePluginDirectory(pluginPlatform);
    if (pluginPlatform.pluginDirectories.length === 0) {
      context.print.warning('You have removed all plugin directories.');
      context.print.info('Plugin scan is now ineffecitive. \
Only explicitly added plugins are active.');
      context.print.info('The Amplify CLI might not be fully functional.');
    }
  } else if (actionAnswer.action === LEARNMORE) {
    displayPluginDirectoriesLearnMore(context);
    await configurePluginDirectories(context, pluginPlatform);
  }

  displayPluginDirectories(context, pluginPlatform);
}

function displayPluginDirectoriesLearnMore(context: Context) {
  context.print.info('');
  context.print.green('The directories contained this list are searched for \
plugins in a plugin scan.');
  context.print.green('You can add or remove from this list to change the \
scan behavior, and consequently its outcome.');
  context.print.green('There are three well-known directories that the CLI \
usually scans for plugins.');
  context.print.red(constants.ParentDirectory);
  context.print.green(`${constants.ParentDirectory} \
is the directory that contains the Amplify CLI Core package.`);
  context.print.blue(normalizePluginDirectory(constants.ParentDirectory));
  context.print.red(constants.LocalNodeModules);
  context.print.green(`${constants.LocalNodeModules} \
is the Amplify CLI Core package's local node_modules directory. `);
  context.print.blue(normalizePluginDirectory(constants.LocalNodeModules));
  context.print.red(constants.GlobalNodeModules);
  context.print.green(`${constants.GlobalNodeModules} \
is the global node_modules directory.`);
  context.print.blue(normalizePluginDirectory(constants.GlobalNodeModules));
  context.print.info('');
}

async function addPluginDirectory(pluginPlatform: PluginPlatform) {
  const ADDCUSTOMDIRECTORY = 'Add custom directory >';
  let options = [constants.ParentDirectory, constants.LocalNodeModules, constants.GlobalNodeModules];

  options = options.filter(item => !pluginPlatform.pluginDirectories.includes(item.toString()));

  let addCustomDirectory = false;
  if (options.length > 0) {
    options.push(ADDCUSTOMDIRECTORY);
    const selectionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select the directory to add',
      choices: options,
    });
    if (selectionAnswer.selection === ADDCUSTOMDIRECTORY) {
      addCustomDirectory = true;
    } else {
      pluginPlatform.pluginDirectories.push(selectionAnswer.selection);
    }
  } else {
    addCustomDirectory = true;
  }

  if (addCustomDirectory) {
    const addNewAnswer = await inquirer.prompt({
      type: 'input',
      name: 'newScanDirectory',
      message: `Enter the full path of the plugin scan directory you want to add${os.EOL}`,
      validate: (input: string) => {
        if (!fs.existsSync(input) || !fs.statSync(input).isDirectory()) {
          return 'Must enter a valid full path of a directory';
        }
        return true;
      },
    });
    pluginPlatform.pluginDirectories.push(addNewAnswer.newScanDirectory.trim());
  }
}

async function removePluginDirectory(pluginPlatform: PluginPlatform) {
  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'directoriesToRemove',
    message: 'Select the directories that Amplify CLI should NOT scan for plugins',
    choices: pluginPlatform.pluginDirectories,
  });
  pluginPlatform.pluginDirectories = pluginPlatform.pluginDirectories.filter(dir => !answer.directoriesToRemove.includes(dir));
}

async function configurePrefixes(context: Context, pluginPlatform: PluginPlatform) {
  displayPrefixes(context, pluginPlatform);

  const ADD = 'add';
  const REMOVE = 'remove';
  const EXIT = 'exit';
  const LEARNMORE = 'Learn more';

  const actionAnswer = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'Select the action on the prefix list',
    choices: [ADD, REMOVE, LEARNMORE, EXIT],
  });

  if (actionAnswer.action === ADD) {
    await addPrefix(pluginPlatform);
  } else if (actionAnswer.action === REMOVE) {
    await removePrefixes(pluginPlatform);
    if (pluginPlatform.pluginPrefixes.length === 0) {
      context.print.warning('You have removed all prefixes for plugin dir name matching!');
      context.print.info(
        'All the packages inside the plugin directories will be checked \
during a plugin scan, this can significantly increase the scan time.'
      );
    }
  } else if (actionAnswer.action === LEARNMORE) {
    displayPluginPrefixesLearnMore(context);
    await configurePluginDirectories(context, pluginPlatform);
  }

  displayPrefixes(context, pluginPlatform);
}

function displayPluginPrefixesLearnMore(context: Context) {
  context.print.info('');
  context.print.green('The package name prefixes contained this list are used for \
plugin name matching in plugin scans.');
  context.print.green(
    'Only packages with matching name are considered plugin candidates, \
they are verified and then added to the Amplify CLI.'
  );
  context.print.green('If this list is empty, all packages inside the scanned directories \
are checked in plugin scans.');
  context.print.green('You can add or remove from this list to change the plugin \
scan behavior, and consequently its outcome.');
  context.print.green('The offical prefix is:');
  context.print.red(constants.AmplifyPrefix);
  context.print.info('');
}

async function addPrefix(pluginPlatform: PluginPlatform) {
  const ADDCUSTOMPREFIX = 'Add custom prefix >';
  let options = [constants.AmplifyPrefix];

  options = options.filter(item => !pluginPlatform.pluginPrefixes.includes(item.toString()));

  let addCustomPrefix = false;
  if (options.length > 0) {
    options.push(ADDCUSTOMPREFIX);
    const selectionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select the prefix to add',
      choices: options,
    });
    if (selectionAnswer.selection === ADDCUSTOMPREFIX) {
      addCustomPrefix = true;
    } else {
      pluginPlatform.pluginPrefixes.push(selectionAnswer.selection);
    }
  } else {
    addCustomPrefix = true;
  }

  if (addCustomPrefix) {
    const addNewAnswer = await inquirer.prompt({
      type: 'input',
      name: 'newPrefix',
      message: 'Enter the new prefix',
      validate: (input: string) => {
        input = input.trim();
        if (input.length < MINPREFIXLENGTH || input.length > MAXPREFIXLENGTH) {
          return 'The Length of prefix must be between 2 and 20.';
        }
        if (!/^[a-zA-Z][a-zA-Z0-9-]+$/.test(input)) {
          return 'Prefix must start with letter, and contain only alphanumerics and dashes(-)';
        }
        return true;
      },
    });
    pluginPlatform.pluginPrefixes.push(addNewAnswer.newPrefix.trim());
  }
}

async function removePrefixes(pluginPlatform: PluginPlatform) {
  const answer = await inquirer.prompt({
    type: 'checkbox',
    name: 'prefixesToRemove',
    message: 'Select the prefixes to remove',
    choices: pluginPlatform.pluginPrefixes,
  });
  pluginPlatform.pluginPrefixes = pluginPlatform.pluginPrefixes.filter(prefix => !answer.prefixesToRemove.includes(prefix));
}

async function configureScanInterval(context: Context, pluginPlatform: PluginPlatform) {
  context.print.green(
    'The Amplify CLI plugin platform regularly scans the local \
system to update its internal metadata on the locally installed plugins.'
  );
  context.print.green('This automatic scan will happen if the last scan \
time has passed for longer than max-scan-interval-in-seconds.');
  context.print.info('');
  displayScanInterval(context, pluginPlatform);
  const answer = await inquirer.prompt({
    type: 'input',
    name: 'interval',
    message: 'Enter the max interval in seconds for automatic plugin scans',
    default: pluginPlatform.maxScanIntervalInSeconds,
    validate: (input: string) => {
      if (isNaN(Number(input))) {
        return 'must enter nubmer';
      }
      return true;
    },
  });
  pluginPlatform.maxScanIntervalInSeconds = parseInt(answer.interval, 10);
  displayScanInterval(context, pluginPlatform);
}

export async function listConfiguration(context: Context, pluginPlatform: PluginPlatform) {
  const pluginDirectories = 'plugin directories';
  const pluginPrefixes = 'plugin prefixes';
  const maxScanIntervalInSeconds = 'max scan interval in seconds';
  const all = 'all';

  const options = [pluginDirectories, pluginPrefixes, maxScanIntervalInSeconds, all];

  const answer = await inquirer.prompt({
    type: 'list',
    name: 'selection',
    message: 'Select the section to list',
    choices: options,
  });

  switch (answer.selection) {
    case pluginDirectories:
      displayPluginDirectories(context, pluginPlatform);
      break;
    case pluginPrefixes:
      displayPrefixes(context, pluginPlatform);
      break;
    case maxScanIntervalInSeconds:
      displayScanInterval(context, pluginPlatform);
      break;
    case all:
      displayConfiguration(context, pluginPlatform);
      break;
    default:
      displayConfiguration(context, pluginPlatform);
      break;
  }
}
