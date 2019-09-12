const path = require('path');

const pluginName = 'codegen';

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, '../commands'));
  commandPath = path.join(commandPath, pluginName, context.input.command);
  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  console.log(`${pluginName} handleAmplifyEvent to be implmented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
};
