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
exports.run = void 0;
const path = __importStar(require("path"));
const featureName = 'env';
const run = async (context) => {
    const { subCommands } = context.input;
    let subcommand = 'help';
    if (subCommands && subCommands.length > 0) {
        subcommand = subCommands[0];
    }
    shiftParams(context);
    subcommand = mapSubcommandAlias(subcommand);
    if (subcommand === 'help') {
        displayHelp(context);
    }
    else {
        let commandModule;
        try {
            commandModule = require(path.normalize(path.join(__dirname, 'env', subcommand)));
        }
        catch (e) {
            if (subCommands) {
                context.print.warning(`Cannot find command: 'amplify env ${subCommands.join(' ')}'`);
            }
            displayHelp(context);
        }
        if (commandModule) {
            await commandModule.run(context);
        }
    }
};
exports.run = run;
function shiftParams(context) {
    delete context.parameters.first;
    delete context.parameters.second;
    delete context.parameters.third;
    const { subCommands } = context.input;
    if (subCommands && subCommands.length > 1) {
        if (subCommands.length > 1) {
            context.parameters.first = subCommands[1];
        }
        if (subCommands.length > 2) {
            context.parameters.second = subCommands[2];
        }
        if (subCommands.length > 3) {
            context.parameters.third = subCommands[3];
        }
    }
}
function displayHelp(context) {
    const header = `amplify ${featureName} <subcommands>`;
    const commands = [
        {
            name: 'add',
            description: 'Adds a new environment to your Amplify Project',
        },
        {
            name: 'pull [--restore]',
            description: 'Pulls your environment with the current cloud environment. Use the restore flag to overwrite your local backend configs with that of the cloud.',
        },
        {
            name: 'checkout <env-name> [--restore]',
            description: 'Moves your environment to the environment specified in the command. Use the restore flag to overwrite your local backend configs with the backend configs of the environment specified.',
        },
        {
            name: 'list [--details] [--json]',
            description: 'Displays a list of all the environments in your Amplify project',
        },
        {
            name: 'get --name <env-name> [--json]',
            description: 'Displays the details of the environment specified in the command',
        },
        {
            name: 'import --name <env-name> --config <provider-configs> [--awsInfo <aws-configs>]',
            description: 'Imports an already existing Amplify project environment stack to your local backend',
        },
        {
            name: 'update [--permissions-boundary <IAM Policy ARN>]',
            description: 'Update the environment configuration',
        },
        {
            name: 'remove <env-name>',
            description: 'Removes an environment from the Amplify project',
        },
    ];
    context.amplify.showHelp(header, commands);
    context.print.info('');
}
function mapSubcommandAlias(subcommand) {
    if (subcommand === 'ls') {
        return 'list';
    }
    return subcommand;
}
//# sourceMappingURL=env.js.map