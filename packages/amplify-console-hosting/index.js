const path = require('path');
const hosting = require('./hosting/index');

async function executeAmplifyCommand(context) {
  const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
  const commandPath = path.join(commandsDirPath, context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
  const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${args.event}`);
  const eventHandlerModule = require(eventHandlerPath);
  await eventHandlerModule.run(context, args);
}

function initEnv(context) {
  hosting.initEnv(context);
}

function status(context) {
  hosting.status(context);
}

function publish(context, doSkipBuild) {
  hosting.publish(context, doSkipBuild);
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
  initEnv,
  status,
  publish,
};
