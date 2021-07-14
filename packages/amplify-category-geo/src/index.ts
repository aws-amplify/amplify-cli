import { $TSContext, $TSObject } from 'amplify-cli-core';
import { category } from './constants';
import * as addCommand from './commands/geo/add';
import * as updateCommand from './commands/geo/update';
import * as removeCommand from './commands/geo/remove';
import * as consoleCommand from './commands/geo/console';
import * as helpCommand from './commands/geo/help';

export const executeAmplifyCommand = async (context: $TSContext) => {
    switch(context.input.command) {
        case 'add':
            await addCommand.run(context);
            break;
        case 'update':
            await updateCommand.run(context);
            break;
        case 'remove':
            await removeCommand.run(context);
            break;
        case 'console':
            await consoleCommand.run(context);
            break;
        case 'help':
            await helpCommand.run(context);
            break;
        default:
            context.print.error(`The subcommand ${context.input.command} is not supported for ${category} category`);
            break;
    }
};

export const handleAmplifyEvent = (context: $TSContext, args: $TSObject) => {
    context.print.info(`${category} handleAmplifyEvent to be implemented`);
    context.print.info(`Received event args ${args}`);
};
