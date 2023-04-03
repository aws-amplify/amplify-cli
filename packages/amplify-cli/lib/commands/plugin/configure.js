"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConfiguration = exports.run = void 0;
const fs = __importStar(require("fs-extra"));
const os = __importStar(require("os"));
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const access_plugins_file_1 = require("../../plugin-helpers/access-plugins-file");
const scan_plugin_platform_1 = require("../../plugin-helpers/scan-plugin-platform");
const plugin_manager_1 = require("../../plugin-manager");
const display_plugin_platform_1 = require("../../plugin-helpers/display-plugin-platform");
const MINPREFIXLENGTH = 2;
const MAXPREFIXLENGTH = 20;
const run = async (context) => {
    const { pluginPlatform } = context;
    const pluginDirectories = 'scannable plugin directories';
    const pluginPrefixes = 'scannable plugin prefixes';
    const maxScanIntervalInSeconds = 'max CLI scan interval in seconds';
    const exit = 'save & exit';
    const options = [pluginDirectories, pluginPrefixes, maxScanIntervalInSeconds, exit];
    let answer;
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
                await configurePluginDirectories(context, pluginPlatform);
                break;
        }
    } while (answer.selection !== exit);
    (0, access_plugins_file_1.writePluginsJsonFile)(pluginPlatform);
    return (0, plugin_manager_1.scan)(pluginPlatform);
};
exports.run = run;
async function configurePluginDirectories(context, pluginPlatform) {
    (0, display_plugin_platform_1.displayPluginDirectories)(context, pluginPlatform);
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
    }
    else if (actionAnswer.action === REMOVE) {
        await removePluginDirectory(pluginPlatform);
        if (pluginPlatform.pluginDirectories.length === 0) {
            context.print.warning('You have removed all plugin directories.');
            context.print.info('Plugin scan is now ineffective. \
Only explicitly added plugins are active.');
            context.print.info('The Amplify CLI might not be fully functional.');
        }
    }
    else if (actionAnswer.action === LEARNMORE) {
        displayPluginDirectoriesLearnMore(context);
        await configurePluginDirectories(context, pluginPlatform);
    }
    (0, display_plugin_platform_1.displayPluginDirectories)(context, pluginPlatform);
}
function displayPluginDirectoriesLearnMore(context) {
    context.print.info('');
    context.print.green('A plugin scan searches this directory list for plugins.');
    context.print.green('You can add or remove from this list to change the \
scan behavior, and consequently its outcome.');
    context.print.green('There are three well-known directories that the CLI \
usually scans for plugins.');
    context.print.red(amplify_cli_core_1.constants.PARENT_DIRECTORY);
    context.print.green(`${amplify_cli_core_1.constants.PARENT_DIRECTORY} \
is the directory that contains the Amplify CLI Core package.`);
    context.print.blue((0, scan_plugin_platform_1.normalizePluginDirectory)(amplify_cli_core_1.constants.PARENT_DIRECTORY));
    context.print.red(amplify_cli_core_1.constants.LOCAL_NODE_MODULES);
    context.print.green(`${amplify_cli_core_1.constants.LOCAL_NODE_MODULES} \
is the Amplify CLI Core package's local node_modules directory. `);
    context.print.blue((0, scan_plugin_platform_1.normalizePluginDirectory)(amplify_cli_core_1.constants.LOCAL_NODE_MODULES));
    context.print.red(amplify_cli_core_1.constants.GLOBAL_NODE_MODULES);
    context.print.green(`${amplify_cli_core_1.constants.GLOBAL_NODE_MODULES} \
is the global node_modules directory.`);
    context.print.blue((0, scan_plugin_platform_1.normalizePluginDirectory)(amplify_cli_core_1.constants.GLOBAL_NODE_MODULES));
    context.print.info('');
}
async function addPluginDirectory(pluginPlatform) {
    const ADDCUSTOMDIRECTORY = 'Add custom directory >';
    let options = [amplify_cli_core_1.constants.PARENT_DIRECTORY, amplify_cli_core_1.constants.LOCAL_NODE_MODULES, amplify_cli_core_1.constants.GLOBAL_NODE_MODULES];
    options = options.filter((item) => !pluginPlatform.pluginDirectories.includes(item.toString()));
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
        }
        else {
            pluginPlatform.pluginDirectories.push(selectionAnswer.selection);
        }
    }
    else {
        addCustomDirectory = true;
    }
    if (addCustomDirectory) {
        const addNewAnswer = await inquirer.prompt({
            type: 'input',
            name: 'newScanDirectory',
            message: `Enter the full path of the plugin scan directory you want to add${os.EOL}`,
            validate: (input) => {
                if (!fs.existsSync(input) || !fs.statSync(input).isDirectory()) {
                    return 'Must enter a valid full path of a directory';
                }
                return true;
            },
        });
        pluginPlatform.pluginDirectories.push(addNewAnswer.newScanDirectory.trim());
    }
}
async function removePluginDirectory(pluginPlatform) {
    const answer = await inquirer.prompt({
        type: 'checkbox',
        name: 'directoriesToRemove',
        message: 'Select the directories that Amplify CLI should NOT scan for plugins',
        choices: pluginPlatform.pluginDirectories,
    });
    pluginPlatform.pluginDirectories = pluginPlatform.pluginDirectories.filter((dir) => !answer.directoriesToRemove.includes(dir));
}
async function configurePrefixes(context, pluginPlatform) {
    (0, display_plugin_platform_1.displayPrefixes)(context, pluginPlatform);
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
    }
    else if (actionAnswer.action === REMOVE) {
        await removePrefixes(pluginPlatform);
        if (pluginPlatform.pluginPrefixes.length === 0) {
            context.print.warning('You have removed all prefixes for plugin dir name matching!');
            context.print.info('All the packages inside the plugin directories will be checked \
during a plugin scan. This can significantly increase the scan time.');
        }
    }
    else if (actionAnswer.action === LEARNMORE) {
        displayPluginPrefixesLearnMore(context);
        await configurePluginDirectories(context, pluginPlatform);
    }
    (0, display_plugin_platform_1.displayPrefixes)(context, pluginPlatform);
}
function displayPluginPrefixesLearnMore(context) {
    context.print.info('');
    context.print.green('The package name prefixes contained this list are used for \
plugin name matching in plugin scans.');
    context.print.green('Only packages with matching name are considered plugin candidates, \
they are verified and then added to the Amplify CLI.');
    context.print.green('If this list is empty, all packages inside the scanned directories \
are checked in plugin scans.');
    context.print.green('You can add or remove from this list to change the plugin \
scan behavior, and consequently its outcome.');
    context.print.green('The offical prefix is:');
    context.print.red(amplify_cli_core_1.constants.AMPLIFY_PREFIX);
    context.print.info('');
}
async function addPrefix(pluginPlatform) {
    const ADDCUSTOMPREFIX = 'Add custom prefix >';
    let options = [amplify_cli_core_1.constants.AMPLIFY_PREFIX];
    options = options.filter((item) => !pluginPlatform.pluginPrefixes.includes(item.toString()));
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
        }
        else {
            pluginPlatform.pluginPrefixes.push(selectionAnswer.selection);
        }
    }
    else {
        addCustomPrefix = true;
    }
    if (addCustomPrefix) {
        const addNewAnswer = await inquirer.prompt({
            type: 'input',
            name: 'newPrefix',
            message: 'Enter the new prefix',
            validate: (input) => {
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
async function removePrefixes(pluginPlatform) {
    const answer = await inquirer.prompt({
        type: 'checkbox',
        name: 'prefixesToRemove',
        message: 'Select the prefixes to remove',
        choices: pluginPlatform.pluginPrefixes,
    });
    pluginPlatform.pluginPrefixes = pluginPlatform.pluginPrefixes.filter((prefix) => !answer.prefixesToRemove.includes(prefix));
}
async function configureScanInterval(context, pluginPlatform) {
    context.print.green('The Amplify CLI plugin platform regularly scans the local \
system to update its internal metadata on the locally installed plugins.');
    context.print.green('This automatic scan will happen if the last scan \
time has passed for longer than max-scan-interval-in-seconds.');
    context.print.info('');
    (0, display_plugin_platform_1.displayScanInterval)(context, pluginPlatform);
    const answer = await inquirer.prompt({
        type: 'input',
        name: 'interval',
        message: 'Enter the max interval in seconds for automatic plugin scans',
        default: pluginPlatform.maxScanIntervalInSeconds,
        validate: (input) => {
            if (isNaN(Number(input))) {
                return 'must enter number';
            }
            return true;
        },
    });
    pluginPlatform.maxScanIntervalInSeconds = parseInt(answer.interval, 10);
    (0, display_plugin_platform_1.displayScanInterval)(context, pluginPlatform);
}
async function listConfiguration(context, pluginPlatform) {
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
            (0, display_plugin_platform_1.displayPluginDirectories)(context, pluginPlatform);
            break;
        case pluginPrefixes:
            (0, display_plugin_platform_1.displayPrefixes)(context, pluginPlatform);
            break;
        case maxScanIntervalInSeconds:
            (0, display_plugin_platform_1.displayScanInterval)(context, pluginPlatform);
            break;
        case all:
            (0, display_plugin_platform_1.displayConfiguration)(context, pluginPlatform);
            break;
        default:
            (0, display_plugin_platform_1.displayConfiguration)(context, pluginPlatform);
            break;
    }
}
exports.listConfiguration = listConfiguration;
//# sourceMappingURL=configure.js.map