import { $TSContext } from '@aws-amplify/amplify-cli-core';
import path from 'path';

// TODO: remove dynamic require

/**
 * executes main amplify command into uibuilder
 */
export const executeAmplifyCommand = async (context: $TSContext, cmd: string): Promise<void> => {
  const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
  const commandPath = path.join(commandsDirPath, cmd || context.input.command);
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const commandModule = require(commandPath);
  await commandModule.run(context);
};

/**
 * runs event based command
 */
export const handleAmplifyEvent = async (context: $TSContext, { event }: { event: string }): Promise<void> => {
  const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
  const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${event}`);
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context);
};
