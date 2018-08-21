const inquirer = require('inquirer'); 
const pinpointHelper = require('../../lib/pinpoint-helper');
const notificationManager = require('../../lib/notifications-manager'); 

module.exports = {
  name: "remove",
  alias: 'disable',
  run: async (context) => {
    const availableChannels = notificationManager.getAvailableChannels(context); 
    const enabledChannels = notificationManager.getEnabledChannels(context); 

    if(enabledChannels.length > 0){
        let channelName = context.parameters.first;
    
        if(!channelName || !availableChannels.includes(channelName)){
            const answer = await inquirer.prompt({
                name: 'selection',
                type: 'list',
                message: 'Choose the push notification channel to disable.',
                choices: enabledChannels,
                default: enabledChannels[0],
            });
            channelName = answer.selection;
        }else if(!enabledChannels.includes(channelName)){
            context.print.info(`The ${channelName} channel has NOT been enabled.`)
            channelName = undefined; 
        }
    
        if(channelName){
            await notificationManager.disableChannel(context, channelName); 
            notificationManager.updateaServiceMeta(context);
        }
    }else{
        context.print.info(`The ${channelName} channel has NOT been enabled.`)
        channelName = undefined; 
    }
    
    return context;
  },
};
