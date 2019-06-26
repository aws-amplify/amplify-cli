const path = require('path'); 
const fs = require('fs-extra'); 

async function executeAmplifyCommand(context) {
    const commandsDirPath = path.normalize(path.join(__dirname, './src/commands')); 
    let commandPath = path.join(commandsDirPath, context.input.command); 
    if(context.input.subCommands && context.input.subCommands.length > 0){
        const subCommandPath = path.join(commandPath, ...context.input.subCommands); 
        if(fs.existsSync(subCommandPath)){
            commandPath = subCommandPath;
        }
    }
    const commandModule = require(commandPath); 
    await commandModule.run(context); 
}

module.exports = {
  executeAmplifyCommand,
};
