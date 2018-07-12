const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const categoryManager = require('../../lib/category-manager');

module.exports = {
    name: 'add',
    alias: ['enable'],
    run: async (context) => {
        const {
            availableServices,
            enabledServices,
            disabledServices
        } = categoryManager.getCategoryStatus(context);

        if(availableServices.length > 0){
            if(disabledServices.length > 1){
                const answers = await inquirer.prompt({
                    type: 'checkbox',
                    name: 'selectedServices',
                    message: 'Please select the service(s) to add.',
                    choices: disabledServices,
                    default: disabledServices[0],
                });
                answers.selectedServices.forEach(service => {
                    tasks.push(()=>categoryManager.runServiceAction(service, 'enable', context));
                }); 
                return sequential(tasks);
            }else if(disabledServices.length == 1){
                categoryManager.runServiceAction(disabledServices[0], 'enable', context); 
            }else{
                throw new Error('Hosting is already fully enabled.')
            }
        }else{
            throw new Error('Hosting is not available from enabled providers.')
        }
    }
};