const fs = require('fs-extra'); 
const path = require('path'); 
const inquirer = require('inquirer'); 
const frameworkConfigMapping = require('./framework-config-mapping');
const constants = require('./constants');

function init(context){
    context.print.info('Please tell us about your project'); 
    context[constants.Label] = {
        framework: guessFramework(context.exeInfo.projectConfig.projectPath)
    };
    return promptForConfiguration(context)
    .then(()=>{
        context.exeInfo.projectConfig[constants.Label] = context[constants.Label]; 
        return context; 
    }); 
}

function onInitSuccessful(context){
    return new Promise((resolve)=>{
        resolve(context); 
    })
}

function configure(context){
    const projectConfig = context.amplify.getProjectConfig(); 

    if(projectConfig[constants.Label]){
        context[constants.Label] = projectConfig[constants.Label];
    }else{
        context[constants.Label] = {}; 
    }

    if(!context[constants.Label]['framework']){
        context[constants.Label]['framework'] = guessFramework(projectConfig.projectPath)
    }

    return promptForConfiguration(context)
    .then(()=>{
        context.amplify.updateProjectConfig(projectConfig.projectPath, 
            constants.Label, context[constants.Label]);
        return context; 
    }); 
}

function promptForConfiguration(context){
    return confirmFramework(context)
    .then(confirmConfiguration);
}

function confirmFramework(context){
    const frameworkComfirmation = {
        type: 'list',
        name: 'framework',
        message: 'What javascript framework are you using',
        choices: Object.keys(frameworkConfigMapping),
        default: context[constants.Label]['framework'],
    };
    return inquirer.prompt(frameworkComfirmation)
    .then((answers) => {
        if(context[constants.Label]['framework'] !== answers.framework){
            context[constants.Label]['framework'] = answers.framework; 
            context[constants.Label]['config'] = 
            frameworkConfigMapping[context[constants.Label]['framework']]; 
        }
        return context;
    });
}

function confirmConfiguration(context){
    if(!context[constants.Label]['config']){
        context[constants.Label]['config'] = 
            frameworkConfigMapping[context[constants.Label]['framework']]; 
    }
    const {config} = context[constants.Label];
    const configurationSettings = [
        {
            type: 'input',
            name: 'SourceDir',
            message: 'Source Directory Path: ',
            default: config.SourceDir
        },
        {
            type: 'input',
            name: 'DistributionDir',
            message: 'Distribution Directory Path:',
            default: config.DistributionDir
        },
        {
            type: 'input',
            name: 'BuildCommand',
            message: 'Build Command: ',
            default: config.BuildCommand
        },
        {
            type: 'input',
            name: 'StartCommand',
            message: 'Start Command:',
            default: config.StartCommand
        },
    ];

    return inquirer.prompt(configurationSettings)
    .then((answers) => {
        config.SourceDir = answers.SourceDir;
        config.DistributionDir = answers.DistributionDir;
        config.BuildCommand = answers.BuildCommand;
        config.StartCommand = answers.StartCommand;
        return context;
    });
}

function guessFramework(projectPath){
    let frameWork = 'none';
    try{
        const packageJsonFilePath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonFilePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'));
            if(packageJson && packageJson.dependencies){
                if(packageJson.dependencies['react']){
                    frameWork = 'react' ;
                    if(packageJson.dependencies['react-native']){
                        frameWork = 'react-native';
                    }
                }else if(packageJson.dependencies['@angular/core']){
                    frameWork = 'angular';
                    if(packageJson.dependencies['ionic-angular']){
                        frameWork = 'ionic';
                    }
                }else if(packageJson.dependencies['vue']){
                    frameWork = 'vue';
                }
            }
        }
    }catch(e){
        frameWork = 'none';
    }
    return frameWork;
}

module.exports = {
    init,
    onInitSuccessful,
    configure
};
  