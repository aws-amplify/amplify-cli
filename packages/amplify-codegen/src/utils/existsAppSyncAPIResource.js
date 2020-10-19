function existsAppSyncAPIResource(context) {
    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    const { api: apis = {} } = amplifyMeta;
    return Object.values(apis).some((value) => {
        if(value.service === 'AppSync' && value.providerPlugin === 'awscloudformation') {
            return true;
        }
    });

}

module.exports = existsAppSyncAPIResource;
