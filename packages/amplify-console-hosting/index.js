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

async function initEnv(context) {
  await hosting.initEnv(context);
}

async function status(context) {
  try {
    await hosting.status(context, true);
  } catch (err) {
    if (err.name === 'ValidationError') {
      context.print.error(err.message);
    } else {
      throw err;
    }
  }
}

async function publish(context, service, args) {
  try {
    const { doSkipBuild } = args || {};
    await hosting.publish(context, doSkipBuild, true);
  } catch (err) {
    if (err.name === 'ValidationError') {
      context.print.error(err.message);
    } else {
      throw err;
    }
  }
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
  initEnv,
  status,
  publish,
};
