const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const categoryManager = require('../../lib/category-manager');

module.exports = {
    name: 'publish',
    run: async (context) => {
        const {
            availableServices,
            enabledServices,
            disabledServices
        } = categoryManager.getCategoryStatus(context);

        if(enabledServices.length > 1){
            const answer = await inquirer.prompt({
                type: 'list',
                name: 'selectedService',
                message: 'Please the service to carry out the pubish.',
                choices: enabledServices,
                default: enabledServices[0],
            });
            return categoryManager.runServiceAction(answer.selectedService, 'pubish', context);
        }else if(enabledServices.length == 1){
        return categoryManager.runServiceAction(enabledServices[0], 'pubish', context);
        }else{
            throw new Error('No hosting service is enabled.')
        }
    }
};