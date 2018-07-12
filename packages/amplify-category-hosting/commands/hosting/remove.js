const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const categoryManager = require('../../lib/category-manager');

module.exports = {
    name: 'remove',
    alias: ['disable'],
    run: async (context) => {
        const {
          availableServices,
          enabledServices,
          disabledServices
        } = categoryManager.getCategoryStatus(context);

        if(enabledServices.length > 1){
            const answers = await inquirer.prompt({
                type: 'checkbox',
                name: 'selectedServices',
                message: 'Please the service(s) to remove.',
                choices: enabledServices,
                default: enabledServices[0],
            });
            if(answers.selectedServices.length < enabledServices.length){
              const tasks = []; 
              answers.selectedServices.forEach(service => {
                tasks.push(()=>categoryManager.runServiceAction(service, 'disable', context));
              }); 
              return sequential(tasks);
            }else{
              return categoryManager.removeCategory(context); 
            }
        }else if(enabledServices.length == 1){
            return categoryManager.removeCategory(context); 
        }else{
            throw new Error('No hosting service is enabled.')
        }
    }
};