const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const open = require('open');
const chalk = require('chalk');
const configManager = require('./configuration-manager');
const fileUPloader = require('./helpers/file-uploader');
const cloudFrontManager = require('./helpers/cloudfront-manager');
const constants = require('../constants');

const serviceName = 'S3AndCloudFront';
const providerPlugin = 'awscloudformation';
const templateFileName = 'template.json';
const parametersFileName = 'parameters.json';


const DEV = 'DEV (S3 only with HTTP)';
const PROD = 'PROD (S3 with CloudFront using HTTPS)';
const Environments = [
  DEV,
  PROD,
];

async function enable(context) {
  let templateFilePath = path.join(__dirname, templateFileName);
  context.exeInfo.template = context.amplify.readJsonFile(templateFilePath);

  let parametersFilePath = path.join(__dirname, parametersFileName);
  context.exeInfo.parameters = context.amplify.readJsonFile(parametersFilePath);

  // will take this out once cloudformation invoke and wait are separated;
  await checkCDN(context);

  await configManager.init(context);

  if (context.parameters.options.p) {
    await configManager.configure(context);
  }

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.ensureDirSync(serviceDirPath);

  templateFilePath = path.join(serviceDirPath, templateFileName);
  let jsonString = JSON.stringify(context.exeInfo.template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

  parametersFilePath = path.join(serviceDirPath, parametersFileName);
  jsonString = JSON.stringify(context.exeInfo.parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  const metaData = {
    service: serviceName,
    providerPlugin,
  };
  return context.amplify.updateamplifyMetaAfterResourceAdd(
    constants.CategoryName,
    serviceName,
    metaData,
  );
}

async function checkCDN(context) {
  const selectEnvironment = {
    type: 'list',
    name: 'environment',
    message: 'Select the environment setup:',
    choices: Environments,
    default: DEV,
  };
  const answer = await inquirer.prompt(selectEnvironment);
  if (answer.environment === DEV) {
    removeCDN(context);
  } else {
    makeBucketPrivate(context);
  }
}

function removeCDN(context) {
  delete context.exeInfo.template.Resources.OriginAccessIdentity;
  delete context.exeInfo.template.Resources.CloudFrontDistribution;
  delete context.exeInfo.template.Resources.PrivateBucketPolicy;
  delete context.exeInfo.template.Outputs.CloudFrontDistributionID;
  delete context.exeInfo.template.Outputs.CloudFrontDomainName;
  delete context.exeInfo.template.Outputs.CloudFrontSecureURL;
}

function makeBucketPrivate(context) {
  delete context.exeInfo.template.Resources.S3Bucket.Properties.AccessControl;
}

async function configure(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  const templateFilePath = path.join(serviceDirPath, templateFileName);
  const parametersFilePath = path.join(serviceDirPath, parametersFileName);

  if (fs.existsSync(templateFilePath)) {
    context.exeInfo.template = context.amplify.readJsonFile(templateFilePath);
    context.exeInfo.parameters = context.amplify.readJsonFile(parametersFilePath);

    await configManager.configure(context);

    let jsonString = JSON.stringify(context.exeInfo.template, null, 4);
    fs.writeFileSync(templateFilePath, jsonString, 'utf8');

    jsonString = JSON.stringify(context.exeInfo.parameters, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

    return context;
  }
  throw new Error('Missing CloudFormation template for hosting.');
}

function publish(context, args) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  const templateFilePath = path.join(serviceDirPath, templateFileName);
  const parametersFilePath = path.join(serviceDirPath, parametersFileName);
  context.exeInfo.template = context.amplify.readJsonFile(templateFilePath);
  context.exeInfo.parameters = context.amplify.readJsonFile(parametersFilePath);
  return fileUPloader.run(context, args.distributionDirPath)
    .then(() => cloudFrontManager.invalidateCloudFront(context))
    .then(() => {
      const { CloudFrontSecureURL } = context.exeInfo.serviceMeta.output;
      if (CloudFrontSecureURL !== undefined) {
        context.print.info('Your app is published successfully.');
        context.print.info(chalk.green(CloudFrontSecureURL));
      } else {
        const { WebsiteURL } = context.exeInfo.serviceMeta.output;
        context.print.info('Your app is published successfully.');
        context.print.info(chalk.green(WebsiteURL));
        open(WebsiteURL, { wait: false });
      }
    })
    .catch((e) => {
      throw e;
    });
}

function console(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const { HostingBucketName: bucket, Region: region } =
        amplifyMeta[constants.CategoryName][serviceName].output;
  const consoleUrl =
        `https://s3.console.aws.amazon.com/s3/buckets/${bucket}/?region=${region}&tab=overview`;
  context.print.info(chalk.green(consoleUrl));
  open(consoleUrl, { wait: false });
}

async function migrate(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  if (fs.existsSync(serviceDirPath)) {
    const templateFilePath = path.join(serviceDirPath, templateFileName);
    if (fs.existsSync(templateFilePath)) {
      let template = context.amplify.readJsonFile(templateFilePath);
      let parameters;
      const parametersFilePath = path.join(serviceDirPath, parametersFileName);
      if (fs.existsSync(parametersFilePath)) {
        parameters = context.amplify.readJsonFile(parametersFilePath);
      }

      const migrationInfo = extractMigrationInfo(template);

      template = migrateTemplate(context, template, migrationInfo);
      parameters = migrateParameters(context, parameters, migrationInfo);

      let jsonString = JSON.stringify(template, null, 4);
      fs.writeFileSync(templateFilePath, jsonString, 'utf8');

      jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
    }
  }
}

function extractMigrationInfo(template) {
  const migrationInfo = {};
  if (template.Resources.S3Bucket) {
    if ((typeof template.Resources.S3Bucket.Properties.BucketName) === 'string') {
      migrationInfo.BucketName = template.Resources.S3Bucket.Properties.BucketName;
    }
  }
  return migrationInfo;
}

function migrateTemplate(context, template, migrationInfo) {
  const templateFilePath = path.join(__dirname, templateFileName);
  const templateNewVersion = context.amplify.readJsonFile(templateFilePath);

  template.Parameters = template.Parameters || {};
  Object.assign(template.Parameters, templateNewVersion.Parameters);

  template.Conditions = template.Conditions || {};
  Object.assign(template.Conditions, templateNewVersion.Conditions);

  if (migrationInfo.BucketName) {
    template.Resources.S3Bucket.Properties.BucketName =
      templateNewVersion.Resources.S3Bucket.Properties.BucketName;
  }

  return template;
}

function migrateParameters(context, parameters, migrationInfo) {
  parameters = parameters || {};
  if (migrationInfo.BucketName) {
    const parametersFilePath = path.join(__dirname, parametersFileName);
    const parametersNewVersion = context.amplify.readJsonFile(parametersFilePath);
    parametersNewVersion.bucketName = migrationInfo.BucketName;
    Object.assign(parameters, parametersNewVersion);
  }
  return parameters;
}

module.exports = {
  enable,
  configure,
  publish,
  console,
  migrate,
};
