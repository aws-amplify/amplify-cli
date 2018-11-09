const fs = require('fs-extra');
const pinpointHelper = require('./pinpoint-helper'); 
const constants = require('./constants'); 
const notificationManager = require('./notifications-manager'); 

async function initEnv(context){
    await pullCurrentAmplifyMeta(context); 
    await constructAmplifyMeta(context); 
    await pushChanges(context); //remove this line after add and push are separated.
}

async function pullCurrentAmplifyMeta(context){
    let pinpointApp; 

    const envFilepath = pathManager.getLocalEnvFilePath();
    const { envName } = JSON.parse(fs.readFileSync(envFilepath));
    
    const teamProviderInfoFilepath = context.amplify.pathManger.getProviderInfoFilePath();
    if(fs.existsSync(teamProviderInfoFilepath)){
        const teamProviderInfo = require(teamProviderInfoFilepath);
        if(teamProviderInfo[envName] && teamProviderInfo[envName][constants.CategoryName]){
            pinpointApp = teamProviderInfo[envName][constants.CategoryName]; 
        }
    }

    const currentMetaFilePath = context.amplify.pathManger.getCurentAmplifyMetaFilePath(); 
    const currentBackendAmplifyMeta =  JSON.parse(fs.readFileSync(currentMetaFilePath));
    if(!pinpointApp){
        pinpointApp = 
        pinpointHelper.scanCategoryMetaForPinpoint(currentBackendAmplifyMeta[constants.AnalyticsCategoryName]);
    }

    if(pinpointApp){
        await notificationManager.pullAllChannels(context, pinpointApp); 
        currentBackendAmplifyMeta[constants.CategoryName]={};
        currentBackendAmplifyMeta[constants.CategoryName][pinpointApp.Name] = {
            "serivce": constants.PinpointName,
            "output": pinpointApp,
            "lastPushTimeStamp": new Date(),
        };
    }
}

async function constructAmplifyMeta(context){
    const backendConfigFilePath = context.amplify.pathManger.getBackendConfigFilePath(); 
    const backendConfig =  JSON.parse(fs.readFileSync(backendConfigFilePath));
    if(backendConfig[constants.CategoryName]){
        
    }
}

async function pushChanges(context){

}

async function initEnvPush(context){
    await pushChanges(context); 
}

module.exports = {
    initEnv,
    initEnvPush
};

  