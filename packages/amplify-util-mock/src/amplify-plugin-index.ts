import * as path from 'path';

const pluginName = 'mock';

export async function executeAmplifyCommand(context: any) {
  let commandPath = path.normalize(path.join(__dirname, '../commands/mock'));
  if (context.input.command === 'help') {
    //help command could be added by the cli platform
    if(context.input.argv.length > 3 && context.input.argv[3] === 'help'){
      commandPath = path.join(commandPath, context.input.command);
    }else{
      commandPath = path.join(commandPath, pluginName);
    }
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: any, args: any) {
  console.log(`${pluginName} handleAmplifyEvent to be implmented`);
  context.print.info(`Received event args ${args}`);
}