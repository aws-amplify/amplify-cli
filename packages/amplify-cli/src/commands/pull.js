const { initializeEnv } = require('../lib/initialize-env');

module.exports = {
    name: 'pull',
    run: async context => {
        context.amplify.constructExeInfo(context);
        context.exeInfo.forcePush = false;
        context.exeInfo.restoreBackend = false;
        
        await initializeEnv(context); 
        
        context.print.info('Resource status:')
        const hasChanges = await context.amplify.showResourceTable();
        
        if(hasChanges){
            context.pring.info(''); 
            context.print.info('Local changes detected.')
            const confirmOverride = await context.prompt.confirm('Do you want to override local changes with the current cloud version?'); 
            if(confirmOverride){
                console.log('confirmOverride////////////////')
            }else{
                context.print.info("Run 'amplify push' to push your local changes to the cloud.");
            }
        }else{
            context.pring.info(''); 
            context.print.info('No local changes detected.');
        }
    },
  };
  