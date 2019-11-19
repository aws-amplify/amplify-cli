import * as path from 'path';

const pluginName = 'mock';

export async function executeAmplifyCommand(context: any) {
  let commandPath = path.normalize(path.join(__dirname, '../commands'));
  commandPath = path.join(commandPath, pluginName, context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: any, args: any) {
  context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}
