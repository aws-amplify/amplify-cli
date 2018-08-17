const inquirer = require('inquirer');
const p8decoder = require('./p8decoder');

async function run(context){
    const questions = [
        {
            name: 'BundleId',
            type: 'input',
            message: 'The bundle id used for APNs Tokens: ',
        },
        {
            name: 'TeamId',
            type: 'input',
            message: 'The team id used for APNs Tokens: ',
        },
        {
            name: 'TokenKeyId',
            type: 'input',
            message: 'The key id used for APNs Tokens: ',
        },
        {
            name: 'filePath',
            type: 'input',
            message: 'The key file path (.p8): ',
        }
    ];
    let keyConfig = await inquirer.prompt(questions);
    keyConfig.TokenKey = await p8decoder.run(keyConfig.filePath);
    delete keyConfig.filePath; 

    return keyConfig; 
}

module.exports = {
    run
}