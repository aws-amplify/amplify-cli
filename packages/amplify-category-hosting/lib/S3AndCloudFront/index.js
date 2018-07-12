const fs = require('fs-extra'); 
const path = require('path');
const inquirer = require('inquirer');
const constants = require('../constants'); 
const serviceName = 'S3AndCloudFront';
const providerPlugin = "amplify-provider-awscloudformation";

function enable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const categoryDirPath = path.join(projectBackendDirPath, constants.CategoryName); 
  const serviceDirPath = path.join(categoryDirPath, serviceName)
  const metaData = {
    "service": serviceName,
    "providerPlugin": providerPlugin
  }; 
  fs.ensureDirSync(serviceDirPath); 
  fs.copySync(__dirname, serviceDirPath, {filter: (src)=>{return path.basename(src)!== 'index.js'}});

  return context.amplify.updateamplifyMetaAfterResourceAdd(
    constants.CategoryName,
    serviceName,
    metaData,
  );
}

async function disable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const categoryDirPath = path.join(projectBackendDirPath, constants.CategoryName); 
  const serviceDirPath = path.join(categoryDirPath, serviceName)
  fs.removeSync(serviceDirPath);
}
  
module.exports = {
  enable,
  disable
};
  