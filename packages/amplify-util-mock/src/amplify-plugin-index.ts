import * as path from 'path';

const pluginName = 'mock';

export async function executeAmplifyCommand(context: any) {
  const commandPath = path.normalize(path.join(__dirname, 'commands', pluginName, context.input.command));
  const commandModule = await import(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: any, args: any) {
  context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}
