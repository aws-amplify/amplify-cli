const path = require('path');

const pluginName = 'xr';

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, pluginName);
  } else {
    commandPath = path.join(commandPath, pluginName, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  console.log(`${pluginName} handleAmplifyEvent to be implmented`);
  context.amplify.print.info(`Received event args ${args}`);
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
};
