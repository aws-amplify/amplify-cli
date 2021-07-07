import { $TSContext, $TSObject } from 'amplify-cli-core';
import path from 'path';
import { category } from './constants';

export const executeAmplifyCommand = async (context: $TSContext) => {
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, category);
    } else {
        commandPath = path.join(commandPath, category, context.input.command);
    }

    const commandModule = require(commandPath);
    await commandModule.run(context);
};

export const handleAmplifyEvent = (context: $TSContext, args: $TSObject) => {
    context.print.info(`${category} handleAmplifyEvent to be implemented`);
    context.print.info(`Received event args ${args}`);
};
