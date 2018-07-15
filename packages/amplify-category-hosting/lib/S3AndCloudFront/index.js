const fs = require('fs-extra'); 
const path = require('path');
const inquirer = require('inquirer');
const moment = require('moment'); 
const opn = require('opn');
const chalk = require('chalk');
const fileUPloader = require('./helpers/file-uploader'); 
const constants = require('../constants'); 
const serviceName = 'S3AndCloudFront';
const providerPlugin = "amplify-provider-awscloudformation";

const templateFileName = 'hosting-s3andcloudfront-template.json'; 
const parametersFileName = 'parameters.json'; 

function enable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.ensureDirSync(serviceDirPath); 
  
  fs.copySync(path.join(__dirname, 'template.json'), path.join(serviceDirPath, templateFileName));

  const parameters = JSON.parse(fs.readFileSync(path.join(__dirname, 'parameters.json'))); 

  const { projectConfig } = context.exeInfo; 
  const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}-`;
  const bucketName = projectConfig.projectName + timeStamp + parameters['HostingBucketName'];
  parameters['HostingBucketName'] = bucketName.replace(/[^-a-z0-9]/g, '');

  const parameterQuestions = [
    {
      name: 'HostingBucketName',
      type: 'input',
      message: 'hosting bucket name',
      default: parameters['HostingBucketName']
    },
    {
      name: 'IndexDocument',
      type: 'input',
      message: 'index doc for the website',
      default: parameters['IndexDocument']
    },
    {
      name: 'ErrorDocument',
      type: 'input',
      message: 'error doc for the website',
      default: parameters['ErrorDocument']
    },
  ];

  return inquirer.prompt(parameterQuestions)
  .then((answers) => {
    const jsonString = JSON.stringify(answers, null, 4);
    const parametersFilePath = path.join(serviceDirPath, parametersFileName);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
    return answers;
  }).then(()=>{
    const metaData = {
      "service": serviceName,
      "providerPlugin": providerPlugin
    }; 
    return context.amplify.updateamplifyMetaAfterResourceAdd(
      constants.CategoryName,
      serviceName,
      metaData,
    );
  });
}

async function disable(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath(); 
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.removeSync(serviceDirPath);
}

function publish(context, args){
  return fileUPloader.run(context, args.distributionDirPath)
  .then(()=>{
    const { amplifyMeta } = context.exeInfo; 
    const { WebsiteURL }= amplifyMeta[constants.CategoryName][serviceName]['output'];
    context.print.info('Your app is published successfully');
    context.print.info(chalk.green(WebsiteURL));
    opn(WebsiteURL, { wait: false });
  }); 
}
  
module.exports = {
  enable,
  disable,
  publish
};
  