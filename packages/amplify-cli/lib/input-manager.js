"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyInput = exports.getCommandLineInput = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const plugin_manager_1 = require("./plugin-manager");
const input_verification_result_1 = require("./domain/input-verification-result");
const git_manager_1 = require("./extensions/amplify-helpers/git-manager");
const command_input_1 = require("./domain/command-input");
function getCommandLineInput(pluginPlatform) {
    const result = new command_input_1.CLIInput(process.argv);
    if (result.argv && result.argv.length > 2) {
        let index = 2;
        aliasArgs(result.argv);
        const pluginNames = (0, plugin_manager_1.getAllPluginNames)(pluginPlatform);
        if (pluginNames.has(result.argv[2])) {
            result.plugin = result.argv[2];
            index = 3;
        }
        else if (result.argv.length > 3 && pluginNames.has(result.argv[3])) {
            result.plugin = result.argv[3];
            result.argv[3] = result.argv[2];
            result.argv[2] = result.plugin;
            index = 3;
        }
        if (result.argv.length > index && !/^-/.test(result.argv[index])) {
            result.command = result.argv[index];
            index += 1;
        }
        while (result.argv.length > index && !/^-/.test(result.argv[index])) {
            result.subCommands = result.subCommands || new Array();
            result.subCommands.push(result.argv[index]);
            index += 1;
        }
        while (result.argv.length > index) {
            result.options = result.options || {};
            if (/^-/.test(result.argv[index])) {
                const key = result.argv[index].replace(/^-+/, '');
                index += 1;
                if (result.argv.length > index && !/^-/.test(result.argv[index])) {
                    result.options[key] = result.argv[index];
                    index += 1;
                }
                else {
                    result.options[key] = true;
                }
            }
            else {
                const key = result.argv[index];
                index += 1;
                result.options[key] = true;
            }
        }
    }
    return result;
}
exports.getCommandLineInput = getCommandLineInput;
function preserveHelpInformation(input) {
    var _a, _b, _c, _d, _e;
    const subCommands = input.subCommands ? input.subCommands : [];
    if (input.command && input.command.toLowerCase() !== amplify_cli_core_1.constants.HELP) {
        subCommands.unshift(input.command.toLocaleLowerCase());
    }
    const hasLongHelpOption = typeof ((_a = input.options) === null || _a === void 0 ? void 0 : _a[amplify_cli_core_1.constants.HELP]) === 'string';
    const hasShortHelpOption = typeof ((_b = input.options) === null || _b === void 0 ? void 0 : _b[amplify_cli_core_1.constants.HELP_SHORT]) === 'string';
    if (hasLongHelpOption) {
        subCommands.push((_c = input.options) === null || _c === void 0 ? void 0 : _c[amplify_cli_core_1.constants.HELP]);
    }
    else if (hasShortHelpOption) {
        subCommands.push((_d = input.options) === null || _d === void 0 ? void 0 : _d[amplify_cli_core_1.constants.HELP_SHORT]);
    }
    if (input.plugin && input.plugin !== 'core') {
        const isCommandPrecedingPluginName = (subCommands === null || subCommands === void 0 ? void 0 : subCommands.length) && input.argv.indexOf(input.plugin) > input.argv.indexOf(subCommands[0]);
        if (isCommandPrecedingPluginName) {
            subCommands.push(input.plugin);
        }
        else {
            subCommands.unshift(input.plugin);
        }
    }
    if (input.command == 'status' && input.options) {
        const statusSubcommands = (_e = amplify_cli_core_1.commandsInfo
            .find((commandInfo) => commandInfo.command == 'status')) === null || _e === void 0 ? void 0 : _e.subCommands.map((subCommandInfo) => subCommandInfo.subCommand);
        const potentialStatusSubcommands = statusSubcommands ? statusSubcommands : [];
        const optionKeys = Object.keys(input.options);
        for (const potentialSubcommand of potentialStatusSubcommands) {
            if (optionKeys.includes(potentialSubcommand)) {
                subCommands.push(potentialSubcommand);
                break;
            }
        }
    }
    if (input.options) {
        input.options[amplify_cli_core_1.constants.HELP] = true;
        delete input.options[amplify_cli_core_1.constants.HELP_SHORT];
    }
    input.command = amplify_cli_core_1.constants.HELP;
    input.subCommands = subCommands;
    return input;
}
function normalizeInput(input) {
    if (input.options) {
        if (input.options[amplify_cli_core_1.constants.VERSION] || input.options[amplify_cli_core_1.constants.VERSION_SHORT]) {
            input.options[amplify_cli_core_1.constants.VERSION] = true;
            delete input.options[amplify_cli_core_1.constants.VERSION_SHORT];
        }
        if (input.options[amplify_cli_core_1.constants.HELP] || input.options[amplify_cli_core_1.constants.HELP_SHORT]) {
            preserveHelpInformation(input);
        }
        if (input.options[amplify_cli_core_1.constants.YES] || input.options[amplify_cli_core_1.constants.YES_SHORT]) {
            input.options[amplify_cli_core_1.constants.YES] = true;
            delete input.options[amplify_cli_core_1.constants.YES_SHORT];
        }
        if (input.options[amplify_cli_core_1.constants.YES] === undefined) {
            input.options[amplify_cli_core_1.constants.YES] = false;
        }
    }
    input.command = input.command || amplify_cli_core_1.constants.PLUGIN_DEFAULT_COMMAND;
    return input;
}
function verifyInput(pluginPlatform, input) {
    const result = new input_verification_result_1.InputVerificationResult();
    if (input.command === 'status') {
        input = normalizeStatusCommandOptions(input);
    }
    input.plugin = input.plugin || amplify_cli_core_1.constants.CORE;
    normalizeInput(input);
    const pluginCandidates = (0, plugin_manager_1.getPluginsWithName)(pluginPlatform, input.plugin);
    if (pluginCandidates.length > 0) {
        for (let i = 0; i < pluginCandidates.length; i++) {
            const { name, commands, commandAliases } = pluginCandidates[i].manifest;
            if ((commands && commands.includes(amplify_cli_core_1.constants.HELP)) || (commandAliases && Object.keys(commandAliases).includes(amplify_cli_core_1.constants.HELP))) {
                result.helpCommandAvailable = true;
            }
            if (commands && commands.includes(input.command)) {
                result.verified = true;
                break;
            }
            if (commandAliases && Object.keys(commandAliases).includes(input.command)) {
                input.command = commandAliases[input.command];
                result.verified = true;
                break;
            }
            if (Array.isArray(input.subCommands) && input.subCommands.length > 0) {
                if (commands && commands.includes(input.subCommands[0])) {
                    const command = input.subCommands[0];
                    input.subCommands[0] = input.command;
                    input.command = command;
                    result.verified = true;
                    break;
                }
                if (commandAliases && Object.prototype.hasOwnProperty.call(commandAliases, input.subCommands[0])) {
                    const command = commandAliases[input.subCommands[0]];
                    input.subCommands[0] = input.command;
                    input.command = command;
                    result.verified = true;
                    break;
                }
            }
            if (input.command === amplify_cli_core_1.constants.PLUGIN_DEFAULT_COMMAND) {
                if (commands && commands.includes(name)) {
                    input.command = name;
                    result.verified = true;
                    break;
                }
                if (input.options && input.options[amplify_cli_core_1.constants.VERSION] && commands && commands.includes(amplify_cli_core_1.constants.VERSION)) {
                    input.command = amplify_cli_core_1.constants.VERSION;
                    result.verified = true;
                    break;
                }
                if (input.options && input.options[amplify_cli_core_1.constants.HELP] && commands && commands.includes(amplify_cli_core_1.constants.HELP)) {
                    input.command = amplify_cli_core_1.constants.HELP;
                    result.verified = true;
                    break;
                }
                if (commands && commands.includes(amplify_cli_core_1.constants.HELP)) {
                    input.command = amplify_cli_core_1.constants.HELP;
                    result.verified = true;
                    break;
                }
            }
        }
        if (!result.verified) {
            let commandString = input.plugin === amplify_cli_core_1.constants.CORE ? '' : input.plugin;
            if (input.command !== amplify_cli_core_1.constants.PLUGIN_DEFAULT_COMMAND) {
                commandString += ' ' + input.command;
            }
            if (input.subCommands) {
                commandString += ' ' + input.subCommands.join(' ');
            }
            result.message = `The Amplify CLI can NOT find command: ${commandString}`;
        }
    }
    else {
        result.verified = false;
        result.message = `The Amplify CLI can NOT find any plugin with name: ${input.plugin}`;
    }
    return result;
}
exports.verifyInput = verifyInput;
function aliasArgs(argv) {
    if (argv.length >= 4 && argv[2] === 'override' && argv[3] === 'project') {
        argv[3] = 'root';
        const { projectPath } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
        const gitIgnoreFilePath = amplify_cli_core_1.pathManager.getGitIgnoreFilePath(projectPath);
        (0, git_manager_1.insertAmplifyIgnore)(gitIgnoreFilePath);
    }
}
const convertKeysToLowerCase = (obj) => {
    const newObj = {};
    Object.entries(obj).forEach(([key, value]) => {
        newObj[key.toLowerCase()] = value;
    });
    return newObj;
};
const normalizeStatusCommandOptions = (input) => {
    const options = input.options ? input.options : {};
    const allowedVerboseIndicators = [amplify_cli_core_1.constants.VERBOSE, 'v'];
    allowedVerboseIndicators.forEach((verboseFlag) => {
        if (options[verboseFlag] !== undefined) {
            if (typeof options[verboseFlag] === 'string') {
                const pluginName = options[verboseFlag].toLowerCase();
                options[pluginName] = true;
            }
            delete options[verboseFlag];
            options.verbose = true;
        }
    });
    const returnInput = input;
    if (returnInput.plugin) {
        options[returnInput.plugin] = true;
        delete returnInput.plugin;
    }
    if (returnInput.subCommands) {
        const allowedSubCommands = [amplify_cli_core_1.constants.HELP, amplify_cli_core_1.constants.VERBOSE];
        const inputSubCommands = [];
        returnInput.subCommands.forEach((subCommand) => {
            if (!allowedSubCommands.includes(subCommand)) {
                options[subCommand.toLowerCase()] = true;
            }
            else {
                inputSubCommands.push(subCommand);
            }
        });
        returnInput.subCommands = inputSubCommands;
    }
    returnInput.options = convertKeysToLowerCase(options);
    return returnInput;
};
//# sourceMappingURL=input-manager.js.map