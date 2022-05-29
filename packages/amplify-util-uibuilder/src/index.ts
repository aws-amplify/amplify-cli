import { $TSContext } from 'amplify-cli-core';
import path from 'path';

export async function executeAmplifyCommand(context: $TSContext, cmd: string) {
  const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
  const commandPath = path.join(commandsDirPath, cmd ? cmd : context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: $TSContext, { event }: { event: string }) {
  const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
  const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${event}`);
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context);
}
