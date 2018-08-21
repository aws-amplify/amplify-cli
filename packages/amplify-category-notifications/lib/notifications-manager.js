const constants = require('./constants'); 

const channelWorkers = {
    APNS: './channel-APNS',
    FCM: './channel-FCM',
    Email: './channel-Email',
    SMS: './channel-SMS',
};

async function getAvailableChannels(context){
    return Object.keys(channelWorkers);
}

async function isChannelEnabled(context, channelName){
    const enabledChannels = getEnabledChannels(context); 
    return enabledChannels.includes(channelName); 
}

async function getEnabledChannels(context){
    let result = []; 
    const { amplifyMeta } = context.exeInfo;
    const availableChannels = getAvailableChannels(context); 
    const categoryMeta = amplifyMeta[constants.CategoryName];
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (let i = 0; i < services.length; i++) {
            const serviceMeta = analyticsMeta[services[i]]; 
            if (serviceMeta.service === 'Pinpoint' && 
                serviceMeta.output && 
                serviceMeta.output.Id){
                availableChannels.forEach(channel => {
                    if(serviceMeta.output[channel] && serviceMeta.output[channel].Enabled){
                        result.push(channel); 
                    }
                });
                break;     
            }
        }
    }
    return result; 
}

async function getDisabledChannels(context){
    let result = []; 
    const { amplifyMeta } = context.exeInfo;
    const availableChannels = getAvailableChannels(context); 
    const categoryMeta = amplifyMeta[constants.CategoryName];
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (let i = 0; i < services.length; i++) {
            const serviceMeta = analyticsMeta[services[i]]; 
            if (serviceMeta.service === 'Pinpoint' && 
                serviceMeta.output && 
                serviceMeta.output.Id){
                availableChannels.forEach(channel => {
                    if(!serviceMeta.output[channel] || !serviceMeta.output[channel].Enabled){
                        result.push(channel); 
                    }
                });
                break;     
            }
        }
    }
    return result; 
}

async function enableChannel(context, channelName){
    if(Object.keys(channelworkers).includes[channelName]){
        const channelWorker = require(channelworkers[channelName]);
        await channelWorker.enable(context); 
    }
}

async function disableChannel(context, channelName){
    if(Object.keys(channelworkers).includes[channelName]){
        const channelWorker = require(channelworkers[channelName]);
        await channelWorker.disable(context); 
    }
}

async function configureChannel(context, channelName){
    if(Object.keys(channelworkers).includes[channelName]){
        const channelWorker = require(channelworkers[channelName]);
        await channelWorker.configure(context); 
    }
}

async function updateaServiceMeta(context) {
    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const jsonString = JSON.stringify(context.exeInfo.amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

module.exports = {
    getAvailableChannels,
    getEnabledChannels,
    getDisabledChannels,
    getChannelStatus,
    enableChannel,
    disableChannel,
    configureChannel,
    updateaServiceMeta
};
