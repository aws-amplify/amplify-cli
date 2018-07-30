const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const moment = require('moment');
const opn = require('opn');
const chalk = require('chalk');
const fileUPloader = require('./helpers/file-uploader');
const constants = require('../constants');

const serviceName = 'S3AndCloudFront';
const providerPlugin = 'amplify-provider-awscloudformation';

const templateFileName = 'hosting-s3andcloudfront-template.json';
const parametersFileName = 'parameters.json';

let parameters = {
  HostingBucketName: 'hosting-bucket',
  IndexDocument: 'index.html',
  ErrorDocument: 'error.html',
};

function enable(context) {
  return configure(context)
    .then(() => {
      const metaData = {
        service: serviceName,
        providerPlugin,
      };
      return context.amplify.updateamplifyMetaAfterResourceAdd(
        constants.CategoryName,
        serviceName,
        metaData,
      );
    });
}

function configure(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.ensureDirSync(serviceDirPath);

  const templateFilePath = path.join(serviceDirPath, templateFileName);
  if (!fs.existsSync(templateFilePath)) {
    fs.copySync(path.join(__dirname, 'template.json'), templateFilePath);
  }

  let currentParameters;
  const parametersFilePath = path.join(serviceDirPath, parametersFileName);
  if (fs.existsSync(parametersFilePath)) {
    try {
      currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
    } catch (e) {
      currentParameters = undefined;
    }
  }

  if (currentParameters) {
    parameters = currentParameters;
  } else {
    const { projectConfig } = context.exeInfo;
    const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}-`;
    const bucketName = projectConfig.projectName + timeStamp + parameters.HostingBucketName;
    parameters.HostingBucketName = bucketName.replace(/[^-a-z0-9]/g, '');
  }

  const parameterQuestions = [
    {
      name: 'HostingBucketName',
      type: 'input',
      message: 'hosting bucket name',
      default: parameters.HostingBucketName,
    },
    {
      name: 'IndexDocument',
      type: 'input',
      message: 'index doc for the website',
      default: parameters.IndexDocument,
    },
    {
      name: 'ErrorDocument',
      type: 'input',
      message: 'error doc for the website',
      default: parameters.ErrorDocument,
    },
  ];
  return inquirer.prompt(parameterQuestions)
    .then((answers) => {
      const jsonString = JSON.stringify(answers, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      return answers;
    });
}

function publish(context, args) {
  return fileUPloader.run(context, args.distributionDirPath)
    .then(() => {
      const { amplifyMeta } = context.amplify.getProjectDetails();
      const { WebsiteURL } = amplifyMeta[constants.CategoryName][serviceName].output;
      context.print.info('Your app is published successfully');
      context.print.info(chalk.green(WebsiteURL));
      opn(WebsiteURL, { wait: false });
    });
}

function console(context){
  const amplifyMeta = context.amplify.getProjectMeta();
  const bucketName = amplifyMeta[constants.CategoryName][serviceName].output.HostingBucketName;
  const region = amplifyMeta[constants.CategoryName][serviceName].output.Region;
  const consoleUrl = `https://s3.console.aws.amazon.com/s3/buckets/${bucketName}/?region=${region}&tab=overview`;
  opn(consoleUrl, { wait: false });
}

module.exports = {
  enable,
  configure,
  publish,
  console
};
