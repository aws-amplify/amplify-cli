const path = require('path');

async function executeAmplifyCommand(context, cmd) {
  const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
  const commandPath = path.join(commandsDirPath, cmd ? cmd : context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
  const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${args.event}`);
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context, args);
}

function overrideAdminUiName() {
  return 'Amplify Admin UI';
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
  overrideAdminUiName,
};
