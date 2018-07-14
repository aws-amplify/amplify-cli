const fs = require('fs-extra'); 
const path = require('path');
const fileUPloader = require('./helpers/file-uploader'); 
const constants = require('../constants'); 
const serviceName = 'S3AndCloudFront';
const providerPlugin = "amplify-provider-awscloudformation";

function enable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.ensureDirSync(serviceDirPath); 

  const copyFilter = (src) => path.basename(src).indexof('template.json') !== -1 ||
                              path.basename(src).indexof('parameters.json') !== -1;
  fs.copySync(__dirname, serviceDirPath, {filter: copyFilter});

  const metaData = {
    "service": serviceName,
    "providerPlugin": providerPlugin
  }; 
  return context.amplify.updateamplifyMetaAfterResourceAdd(
    constants.CategoryName,
    serviceName,
    metaData,
  );
}

async function disable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.removeSync(serviceDirPath);
}

function publish(context, args){
  return fileUPloader.run(context, args.distributionDirPath); 
}
  
module.exports = {
  enable,
  disable,
  publish
};
  