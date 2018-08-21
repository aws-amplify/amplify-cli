const constants = require('./constants'); 

const channelWorkers = {
    APNS: './channel-APNS',
    FCM: './channel-FCM',
    Email: './channel-Email',
    SMS: './channel-SMS',
};

await function getAvailableChannels(context){
}

await function getChannelStatus(context, channelName){
}

await function getEnabledChannels(context){
}

await function getDisabledChannels(context){
}

await function enableChannel(context, channelName){
}

await function disableChannel(context, channelName){
}

module.exports = {
    getAvailableChannels,
    getEnabledChannels,
    getDisabledChannels,
    getChannelStatus,
    enableChannel,
    disableChannel
};
