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
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_plugin_type_1 = require("../domain/amplify-plugin-type");
const verify_plugin_1 = require("./verify-plugin");
const display_plugin_platform_1 = require("./display-plugin-platform");
const INDENTATIONSPACE = 4;
async function createNewPlugin(context, pluginParentDirPath) {
    const pluginName = await getPluginName(context, pluginParentDirPath);
    if (pluginName) {
        const pluginDirPath = await copyAndUpdateTemplateFiles(context, pluginParentDirPath, pluginName);
        return pluginDirPath;
    }
    return undefined;
}
exports.default = createNewPlugin;
async function getPluginName(context, pluginParentDirPath) {
    let pluginName = 'my-amplify-plugin';
    const yesFlag = context.input.options && context.input.options[amplify_cli_core_1.constants.YES];
    if (context.input.subCommands.length > 1) {
        pluginName = context.input.subCommands[1];
    }
    else if (!yesFlag) {
        const pluginNameQuestion = {
            type: 'input',
            name: 'pluginName',
            message: 'What should be the name of the plugin:',
            default: pluginName,
            validate: async (input) => {
                const pluginNameValidationResult = await (0, verify_plugin_1.validPluginName)(input);
                if (!pluginNameValidationResult.isValid) {
                    return pluginNameValidationResult.message || 'Invalid plugin name';
                }
                return true;
            },
        };
        const answer = await inquirer.prompt(pluginNameQuestion);
        pluginName = answer.pluginName;
    }
    const pluginDirPath = path.join(pluginParentDirPath, pluginName);
    if (fs.existsSync(pluginDirPath) && !yesFlag) {
        context.print.error(`The directory ${pluginName} already exists`);
        const overwriteQuestion = {
            type: 'confirm',
            name: 'ifOverWrite',
            message: 'Do you want to overwrite it?',
            default: false,
        };
        const answer = await inquirer.prompt(overwriteQuestion);
        if (answer.ifOverWrite) {
            return pluginName;
        }
        return undefined;
    }
    return pluginName;
}
async function copyAndUpdateTemplateFiles(context, pluginParentDirPath, pluginName) {
    const pluginDirPath = path.join(pluginParentDirPath, pluginName);
    fs.emptyDirSync(pluginDirPath);
    const pluginType = await promptForPluginType(context);
    const eventHandlers = await promptForEventSubscription(context);
    let srcDirPath = path.join(__dirname, '../../templates/plugin-template');
    if (pluginType === amplify_plugin_type_1.AmplifyPluginType.frontend.toString()) {
        srcDirPath = path.join(__dirname, '../../templates/plugin-template-frontend');
    }
    else if (pluginType === amplify_plugin_type_1.AmplifyPluginType.provider.toString()) {
        srcDirPath = path.join(__dirname, '../../templates/plugin-template-provider');
    }
    fs.copySync(srcDirPath, pluginDirPath);
    updatePackageJson(pluginDirPath, pluginName);
    updateAmplifyPluginJson(pluginDirPath, pluginName, pluginType, eventHandlers);
    updateEventHandlersFolder(pluginDirPath, eventHandlers);
    return pluginDirPath;
}
async function promptForPluginType(context) {
    const yesFlag = context.input.options && context.input.options[amplify_cli_core_1.constants.YES];
    if (yesFlag) {
        return amplify_plugin_type_1.AmplifyPluginType.util;
    }
    {
        const pluginTypes = Object.keys(amplify_plugin_type_1.AmplifyPluginType);
        const LEARNMORE = 'Learn more';
        const choices = pluginTypes.concat([LEARNMORE]);
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'selection',
            message: 'Specify the plugin type',
            choices,
            default: amplify_plugin_type_1.AmplifyPluginType.util,
        });
        if (answer.selection === LEARNMORE) {
            displayAmplifyPluginTypesLearnMore(context);
            return await promptForPluginType(context);
        }
        return answer.selection;
    }
}
function displayAmplifyPluginTypesLearnMore(context) {
    context.print.green('The Amplify CLI supports these plugin types:');
    context.print.red(amplify_plugin_type_1.AmplifyPluginType.category);
    context.print.green(`${amplify_plugin_type_1.AmplifyPluginType.category} plugins allows the CLI user to add, \
remove and configure a set of backend resources. They in turn use provider plugins to \
provision these resources in the cloud.`);
    context.print.red(amplify_plugin_type_1.AmplifyPluginType.provider);
    context.print.green(`${amplify_plugin_type_1.AmplifyPluginType.provider} plugins expose methods for other plugins \
like the category plugin to provision resources in the cloud. The Amplify CLI prompts the user \
to select provider plugins to initialize during the execution of the amplify init command \
(if there are multiple cloud provider plugins present), \
and then invoke the init method of the selected provider plugins.`);
    context.print.red(amplify_plugin_type_1.AmplifyPluginType.frontend);
    context.print.green(`${amplify_plugin_type_1.AmplifyPluginType.frontend} plugins are responsible for detecting \
the frontend framework used by the frontend project and handle the frontend project and handle \
generation of all the configuration files required by the frontend framework.`);
    context.print.red(amplify_plugin_type_1.AmplifyPluginType.util);
    context.print.green(`${amplify_plugin_type_1.AmplifyPluginType.util} plugins are general purpose utility plugins, \
they provide utility functions for other plugins.`);
    context.print.green('For more information please read - \
  https://docs.amplify.aws/cli/plugins/architecture#plugin-types');
}
async function promptForEventSubscription(context) {
    const yesFlag = context.input.options && context.input.options[amplify_cli_core_1.constants.YES];
    const eventHandlers = Object.keys(amplify_cli_core_1.AmplifyEvent);
    if (yesFlag) {
        return eventHandlers;
    }
    {
        const LEARNMORE = 'Learn more';
        const choices = eventHandlers.concat([LEARNMORE]);
        const answer = await inquirer.prompt({
            type: 'checkbox',
            name: 'selections',
            message: 'What Amplify CLI events do you want the plugin to handle?',
            choices,
            default: eventHandlers,
        });
        if (answer.selections.includes(LEARNMORE)) {
            displayAmplifyEventsLearnMore(context);
            return await promptForEventSubscription(context);
        }
        return answer.selections;
    }
}
function displayAmplifyEventsLearnMore(context) {
    const indentationStr = (0, display_plugin_platform_1.createIndentation)(INDENTATIONSPACE);
    context.print.green('The Amplify CLI aims to provide a flexible and loosely-coupled \
pluggable platform for the plugins.');
    context.print.green('To make this possible, \
the platform broadcasts events for plugins to handle.');
    context.print.green('If a plugin subscribes to an event, its event handler is \
invoked by the Amplify CLI Core on such event.');
    context.print.green('');
    context.print.green('The Amplify CLI currently broadcasts these events to plugins:');
    context.print.red(amplify_cli_core_1.AmplifyEvent.PreInit);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PreInit} handler is invoked prior to the \
execution of the amplify init command.`);
    context.print.red(amplify_cli_core_1.AmplifyEvent.PostInit);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PostInit} handler is invoked on the \
complete execution of the amplify init command.`);
    context.print.red(amplify_cli_core_1.AmplifyEvent.PrePush);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PrePush} handler is invoked prior to the \
execution of the amplify push command.`);
    context.print.red(amplify_cli_core_1.AmplifyEvent.PostPush);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PostPush} handler is invoked on the \
complete execution of the amplify push command.`);
    context.print.red(amplify_cli_core_1.AmplifyEvent.PrePull);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PrePull} handler is invoked prior to the \
execution of the amplify pull command.`);
    context.print.red(amplify_cli_core_1.AmplifyEvent.PostPull);
    context.print.green(`${indentationStr}${amplify_cli_core_1.AmplifyEvent.PostPull} handler is invoked on the \
complete execution of the amplify pull command.`);
    context.print.warning('This feature is currently under active development, \
events might be added or removed in future releases.');
}
function updatePackageJson(pluginDirPath, pluginName) {
    const filePath = path.join(pluginDirPath, 'package.json');
    const packageJson = amplify_cli_core_1.JSONUtilities.readJson(filePath);
    packageJson.name = pluginName;
    amplify_cli_core_1.JSONUtilities.writeJson(filePath, packageJson);
}
function updateAmplifyPluginJson(pluginDirPath, pluginName, pluginType, eventHandlers) {
    const filePath = path.join(pluginDirPath, amplify_cli_core_1.constants.MANIFEST_FILE_NAME);
    const amplifyPluginJson = amplify_cli_core_1.JSONUtilities.readJson(filePath);
    amplifyPluginJson.name = pluginName;
    amplifyPluginJson.type = pluginType;
    amplifyPluginJson.eventHandlers = eventHandlers;
    amplify_cli_core_1.JSONUtilities.writeJson(filePath, amplifyPluginJson);
}
function updateEventHandlersFolder(pluginDirPath, eventHandlers) {
    const dirPath = path.join(pluginDirPath, 'event-handlers');
    const fileNames = fs.readdirSync(dirPath);
    fileNames.forEach((fileName) => {
        const eventName = fileName.replace('handle-', '').split('.')[0];
        if (!eventHandlers.includes(eventName)) {
            fs.removeSync(path.join(dirPath, fileName));
        }
    });
}
//# sourceMappingURL=create-new-plugin.js.map