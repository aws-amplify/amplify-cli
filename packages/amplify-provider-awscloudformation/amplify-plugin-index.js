async function executeAmplifyCommand(context) {
  console.log(`To be implemented: execute awscloudformation ${context.input.command}\n`);
}

async function handleAmplifyEvent(context, args){
    console.log(`${pluginName} handleAmplifyEvent to be implmented`);
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent
};
