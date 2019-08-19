const inquirer = require('inquirer');

async function askForProfile(profiles) {
    const selectProfile = {
        type: 'list',
        name: 'selectedProfile',
        message: "Please choose the profile you want to use",
        choices: profiles,
        default: profiles[0]
    };
    const answer = await inquirer.prompt(selectProfile);
    return answer.selectedProfile;
}

module.exports = askForProfile;