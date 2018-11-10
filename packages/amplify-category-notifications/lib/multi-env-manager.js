const fs = require('fs-extra');
const sequential = require('promise-sequential');
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
        if(teamProviderInfo[envName] && 
            teamProviderInfo[envName]['categories'] && 
            teamProviderInfo[envName]['categories'][constants.CategoryName]){
            pinpointApp = teamProviderInfo[envName]['categories'][constants.CategoryName]; 
        }
    }

    const currentMetaFilePath = context.amplify.pathManger.getCurentAmplifyMetaFilePath(); 
    const currentBackendAmplifyMeta =  JSON.parse(fs.readFileSync(currentMetaFilePath));
    if(!pinpointApp){
        pinpointApp = pinpointHelper.scanCategoryMetaForPinpoint(
            currentBackendAmplifyMeta[constants.AnalyticsCategoryName]
        );
    }

    if(pinpointApp){
        await notificationManager.pullAllChannels(context, pinpointApp); 
        currentBackendAmplifyMeta[constants.CategoryName]={};
        currentBackendAmplifyMeta[constants.CategoryName][pinpointApp.Name] = {
            "serivce": constants.PinpointName,
            "output": pinpointApp,
            "lastPushTimeStamp": new Date(),
        };
        
        const jsonString = JSON.stringify(currentBackendAmplifyMeta, null, 4);
        fs.writeFileSync(currentMetaFilePath, jsonString, 'utf8');
    }
}

async function constructAmplifyMeta(context){
    const backendConfigFilePath = context.amplify.pathManger.getBackendConfigFilePath(); 
    const backendConfig =  JSON.parse(fs.readFileSync(backendConfigFilePath));
    if(backendConfig[constants.CategoryName]){
        const metaFilePath = context.amplify.pathManger.getAmplifyMetaFilePath(); 
        const amplifyMeta =  JSON.parse(fs.readFileSync(metaFilePath));
        amplifyMeta[constants.CategoryName] = backendConfig[constants.CategoryName];
        const jsonString = JSON.stringify(amplifyMeta, null, 4);
        fs.writeFileSync(metaFilePath, jsonString, 'utf8');
    }
}

async function pushChanges(context){
    const currentMetaFilePath = context.amplify.pathManger.getCurentAmplifyMetaFilePath(); 
    const currentBackendAmplifyMeta =  JSON.parse(fs.readFileSync(currentMetaFilePath));

    const metaFilePath = context.amplify.pathManger.getAmplifyMetaFilePath(); 
    const amplifyMeta =  JSON.parse(fs.readFileSync(metaFilePath));
    
    const availableChannels = notificationManager.getAvailableChannels(); 

    const currentEnabledChannels = []
    const newEnabledChannels = []; 

    if(currentBackendAmplifyMeta && currentBackendAmplifyMeta[constants.CategoryName]){
        const categoryMeta = currentBackendAmplifyMeta[constants.CategoryName];
        const services = Object.keys(categoryMeta);
        for (let i = 0; i < services.length; i++) {
          const serviceMeta = categoryMeta[services[i]];
          if (serviceMeta.service === 'Pinpoint' &&
                                    serviceMeta.output &&
                                    serviceMeta.output.Id) {
            availableChannels.forEach((channel) => {
              if (serviceMeta.output[channel] && serviceMeta.output[channel].Enabled) {
                currentEnabledChannels.push(channel);
              }
            });
            break;
          }
        }
    }


    if(amplifyMeta && amplifyMeta[constants.CategoryName]){
        const categoryMeta = amplifyMeta[constants.CategoryName];
        const services = Object.keys(categoryMeta);
        for (let i = 0; i < services.length; i++) {
          const serviceMeta = categoryMeta[services[i]];
          if ( serviceMeta.service === 'Pinpoint' && serviceMeta.channels ) {
            availableChannels.forEach((channel) => {
              if (serviceMeta.channels.includes(channel)) {
                newEnabledChannels.push(channel);
              }
            });
            break;
          }
        }
    }

    const channelsToEnable = []; 
    const channelsToDisable = []; 
    const channelsToUpdate = []; 

    availableChannels.forEach((channel)=>{
        let isCurrentlyEnabled = currentEnabledChannels.includes(channel); 
        let needToBeEnabled = newEnabledChannels.includes(channel); 

        if(isCurrentlyEnabled && needToBeEnabled){
            channelsToUpdate.push(channel);
        }
        if(isCurrentlyEnabled && !needToBeEnabled){
            channelsToDisable.push(channel); 
        }
        if(!isCurrentlyEnabled && needToBeEnabled){
            channelsToEnable.push(channel);
        }
    });

    const tasks = []; 

    channelsToEnable.map((channel)=>{
        tasks.push(()=>{
            notificationManager.enableChannel(context, channel); 
        })
    });


    channelsToDisable.map((channel)=>{
        tasks.push(()=>{
            notificationManager.disableChannel(context, channel); 
        })
    });


    channelsToUpdate.map((channel)=>{
        tasks.push(()=>{
            notificationManager.configureChannel(context, channel); 
        })
    });

    await sequential(tasks);
}


async function initEnvPush(context){
    await pushChanges(context); 
}

module.exports = {
    initEnv,
    initEnvPush
};

  