const path = require('path'); 
const fs = require('fs-extra');
const inquirer = require('inquirer');
const homedir = require('os').homedir();
const awsRegions = require('./aws-regions'); 

const sharedConfigDirName = '.amplify'; 

function configure(context) {
    printInfo(context); 
    let projectConfigInfo = {context}; 
    return promptForProjectConfigUpdate(projectConfigInfo)
    .then(carryOutConfigAction); 
}

function init(context){
    printInfo(context); 
    let projectConfigInfo = {context}; 
    return comfirmProjectConfigSetup(projectConfigInfo)
    .then(carryOutConfigAction); 
}

function carryOutConfigAction(projectConfigInfo){
    switch(projectConfigInfo.action){
        case 'create':
            create(projectConfigInfo); 
        break; 
        case 'update': 
            update(projectConfigInfo); 
        break; 
        case 'remove': 
            remove(projectConfigInfo); 
        break; 
    }
}

function create(projectConfigInfo){
    configProject(projectConfigInfo)
    .then(validateConfig)
    .then(projectConfigInfo=>{
        if(projectConfigInfo.configValidated){
            createProjectConfig(projectConfigInfo); 
        }
    })
}

function update(projectConfigInfo){
    configProject(projectConfigInfo)
    .then(validateConfig)
    .then(projectConfigInfo=>{
        if(projectConfigInfo.configValidated){
            updateProjectConfig(projectConfigInfo); 
        }
    })
}

function remove(projectConfigInfo){
    return confirmProjectConfigRemoval(projectConfigInfo)
    .then(projectConfigInfo=>{
        if(projectConfigInfo.action != 'cancel'){
            removeProjectConfig(projectConfigInfo); 
        }
    })
}

function printInfo(context){
    context.print.info('General configuration of the aws-cloudformation provider follow that of the aws-cli.');
    context.print.info('Please follow the aws-cli documentation to set up general configuration.');
    context.print.info('You can also configure the provider specifically for this project.'); 
    context.print.info('Project specific configuration overrides the general configuration.'); 
}

function comfirmProjectConfigSetup(projectConfigInfo){
    const configProjectComfirmation = {
        type: 'confirm',
        name: 'setProjectConfig',
        message: 'Set project specific configuration',
        default: false
    };

    return inquirer.prompt(configProjectComfirmation)
    .then(answers => {
        projectConfigInfo.action = answers.setProjectConfig ? 'create' : 'cancel'; 
        return projectConfigInfo; 
    }); 
}

function promptForProjectConfigUpdate(projectConfigInfo){
    getProjectConfig(projectConfigInfo); 
    if(projectConfigInfo.projectConfigExists){
        const updateOrRemove =  {
            type: 'list',
            name: 'action',
            message: "Do you want to udpate or remove the project specific configuration",
            choices: ['update', 'remove', 'cancel'],
            default: 'update'
        };
        return inquirer.prompt(updateOrRemove)
        .then(answers=>{
            projectConfigInfo.action = answers.action; 
            return projectConfigInfo; 
        })
    }else{
        return comfirmProjectConfigSetup(projectConfigInfo); 
    }
}

function confirmProjectConfigRemoval(projectConfigInfo){
    const removeProjectComfirmation = {
        type: 'confirm',
        name: 'removeProjectConfig',
        message: 'Remove project specific configuration',
        default: false
    };
    return inquirer.prompt(removeProjectComfirmation)
    .then(answers => {
        projectConfigInfo.action = answers.removeProjectConfig ? 'confirmed-remove' : 'cancel';
        return projectConfigInfo; 
    }); 
}

function configProject(projectConfigInfo){
    const useProfileConfirmation = {
        type: 'confirm',
        name: 'useProfile',
        message: 'Use profile',
        default: projectConfigInfo.useProfile
    };

    const profileName = {
        type: 'input',
        name: 'profileName',
        message: 'Profile name',
        default: 'default'
    };

    const configurationSettings = [
        {
            type: 'input',
            name: 'accessKeyId',
            message: "accessKeyId: ",
            default: projectConfigInfo.accessKeyId ? projectConfigInfo.accessKeyId : '<accessKeyId>'
        },
        {
            type: 'input',
            name: 'secretAccessKey',
            message: "secretAccessKey: ",
            default: projectConfigInfo.secretAccessKey ? projectConfigInfo.secretAccessKey : '<secretAccessKey>'
        },
        {
            type: 'list',
            name: 'region',
            message: "region: ",
            choices: awsRegions.regions,
            default: projectConfigInfo.region ? projectConfigInfo.region : "us-east-1"
        }
    ];

    return inquirer.prompt(useProfileConfirmation)
    .then(answers => {
        projectConfigInfo.useProfile = answers.useProfile; 
        if(answers.useProfile){
            return inquirer.prompt(profileName)
            .then(answers=>{
                projectConfigInfo.profileName = answers.profileName; 
                return projectConfigInfo; 
            }); 
        }else{
            return inquirer.prompt(configurationSettings)
            .then(answers=>{
                projectConfigInfo.accessKeyId = answers.accessKeyId; 
                projectConfigInfo.secretAccessKey = answers.secretAccessKey; 
                projectConfigInfo.region = answers.region; 
                return projectConfigInfo; 
            }); 
        }
    }); 
}

function validateConfig(projectConfigInfo){
    projectConfigInfo.configValidated = false; 
    if(projectConfigInfo.useProfile){
        if(projectConfigInfo.profileName && projectConfigInfo.profileName.length > 0){
            projectConfigInfo.configValidated = true; 
        }
    }else{
        projectConfigInfo.configValidated = 
            projectConfigInfo.accessKeyId && projectConfigInfo.accessKeyId != '<accessKeyId>' && 
            projectConfigInfo.secretAccessKey && projectConfigInfo.secretAccessKey != '<secretAccessKey>' && 
            projectConfigInfo.region && awsRegions.regions.includes(projectConfigInfo.region); 
    }
    return projectConfigInfo; 
}

function createProjectConfig(projectConfigInfo){
    const context = projectConfigInfo.context; 
    const awsConfigInfo = {
        useProfile: projectConfigInfo.useProfile, 
    }

    if(projectConfigInfo.useProfile){
        awsConfigInfo.profileName = projectConfigInfo.profileName; 
    }else{
        const awsConfig = {
            accessKeyId: projectConfigInfo.accessKeyId, 
            secretAccessKey: projectConfigInfo.secretAccessKey,
            region: projectConfigInfo.region
        }; 
        const sharedConfigDirPath = path.join(homedir, sharedConfigDirName); 
        fs.ensureDirSync(sharedConfigDirPath); 
        const awsConfigFilePath = path.join(sharedConfigDirPath, context.awsmobile.nameManager.makeid(10)); 
        let jsonString = JSON.stringify(awsConfig, null, 4);
        fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8');

        awsConfigInfo.awsConfigFilePath = awsConfigFilePath; 
    }

    const configInfoFilePath = path.join(context.awsmobile.pathManager.getDotConfigDirPath(), 'aws-info.json');
    let jsonString = JSON.stringify(awsConfigInfo, null, 4);
    fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
}

function getProjectConfig(projectConfigInfo){
    const context = projectConfigInfo.context; 
    projectConfigInfo.projectConfigExists = false;
    const configInfoFilePath = path.join(context.awsmobile.pathManager.getDotConfigDirPath(), 'aws-info.json')
    if(fs.existsSync(configInfoFilePath)){
        try{
            const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8')); 
            if(configInfo.useProfile && configInfo.profileName){
                projectConfigInfo.useProfile = configInfo.useProfile;
                projectConfigInfo.profileName = configInfo.profileName;
            }else if(configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)){
                const awsConfig = JSON.parse(fs.readFileSync(configInfo.awsConfigFilePath, 'utf8')); 
                projectConfigInfo.useProfile = false; 
                projectConfigInfo.accessKeyId = awsConfig.accessKeyId; 
                projectConfigInfo.secretAccessKey = awsConfig.secretAccessKey;
                projectConfigInfo.region = awsConfig.region;
            }
            projectConfigInfo.projectConfigExists = true;
        }catch(e){
            fs.removeSync(configInfoFilePath); 
        }
    }
    return projectConfigInfo; 
}

function updateProjectConfig(projectConfigInfo){
    removeProjectConfig(projectConfigInfo); 
    createProjectConfig(projectConfigInfo); 
}

function removeProjectConfig(projectConfigInfo){
    const context = projectConfigInfo.context; 
    const configInfoFilePath = path.join(context.awsmobile.pathManager.getDotConfigDirPath(), 'aws-info.json')
    if(fs.existsSync(configInfoFilePath)){
        const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8')); 
        if(configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)){
            fs.removeSync(configInfo.awsConfigFilePath);
        }
        fs.removeSync(configInfoFilePath)
    }
}

function loadProjectConfig(context, awsClient){
    process.env.AWS_SDK_LOAD_CONFIG = true; 
    const configInfoFilePath = path.join(context.awsmobile.pathManager.getDotConfigDirPath(), 'aws-info.json')
    if(fs.existsSync(configInfoFilePath)){
        const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8')); 
        if(configInfo.useProfile && configInfo.profileName){
            console.log('profileName: ', configInfo.profileName); 
            process.env.AWS_PROFILE = configInfo.profileName; 
        }else if(configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)){
            awsClient.config.loadFromPath(configInfo.awsConfigFilePath);
        }
    }
}

module.exports = {
    init, 
    configure,
    loadProjectConfig
};
