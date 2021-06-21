import path from 'path';
import { category } from './constants';

export async function executeAmplifyCommand(context: any) {
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, category);
    } else {
        commandPath = path.join(commandPath, category, context.input.command);
    }

    const commandModule = require(commandPath);
    await commandModule.run(context);
}

export async function handleAmplifyEvent(context: any, args: any) {
    context.print.info(`${category} handleAmplifyEvent to be implemented`);
    context.print.info(`Received event args ${args}`);
}
