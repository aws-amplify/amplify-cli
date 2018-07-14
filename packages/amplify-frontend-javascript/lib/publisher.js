const builder = require('./builder'); 
const constants = require('./constants');
const hostingPlugin = 'amplify-category-hosting';
const publishService = 'S3AndCloudFront';

function run(context) {
    return builder.run(context)
    .then(publishToHostingBucket)
    .then(onSuccess)
    .catch(onFailure); 
}

function publishToHostingBucket(context){
  const {projectConfig} = context.exeInfo;
  const distributionDirPath = projectConfig[constants.Label]['config']['DistributionDir'];
  const hostingPluginModule = require(context.amplify.getPlugin(hostingPlugin)); 
  hostingPluginModule.publish(context, publishService, { distributionDirPath }); 
}

function onSuccess(context){
  return context;
}

function onFailure(e){
  throw e; 
}

module.exports = {
  run
};
