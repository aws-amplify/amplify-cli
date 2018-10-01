const fs = require('fs-extra');
const inquirer = require('inquirer');
const Ora = require('ora');
const path = require('path');
const opn = require('opn');
const chalk = require('chalk');
const configManager = require('./configuration-manager');
const fileUPloader = require('./helpers/file-uploader');
const cloudFrontManager = require('./helpers/cloudfront-manager');
const constants = require('../constants');

const serviceName = 'S3AndCloudFront';
const providerPlugin = 'awscloudformation';
const templateFileName = 'template.json';


const DEV = 'DEV (S3 only with HTTP)';
const PROD = 'PROD (S3 with CloudFront using HTTPS)';
const Environments = [
  DEV,
  PROD,
];

async function enable(context) {
  let templateFilePath = path.join(__dirname, 'template.json');
  context.exeInfo.template = JSON.parse(fs.readFileSync(templateFilePath));

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
  const jsonString = JSON.stringify(context.exeInfo.template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

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
  delete context.exeInfo.template.Resources.BucketPolicy;
  delete context.exeInfo.template.Resources.S3Bucket.Properties.AccessControl;
}

async function configure(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  const templateFilePath = path.join(serviceDirPath, templateFileName);

  if (fs.existsSync(templateFilePath)) {
    context.exeInfo.template = JSON.parse(fs.readFileSync(templateFilePath));
    await configManager.configure(context);
    const jsonString = JSON.stringify(context.exeInfo.template, null, 4);
    fs.writeFileSync(templateFilePath, jsonString, 'utf8');
    return context;
  }
  throw new Error('Missing CloudFormation template for hosting.');
}

function publish(context, args) {
  const spinner = new Ora('Uploading files');
  spinner.start();
  return fileUPloader.run(context, args.distributionDirPath)
    .then(() => {
      spinner.succeed('Uploading files successful.');
      return cloudFrontManager.invalidateCloudFront(context);
    })
    .then(() => {
      const { CloudFrontSecureURL } = context.exeInfo.serviceMeta.output;
      if (CloudFrontSecureURL !== undefined) {
        context.print.info('Your app is published successfully.');
        context.print.info(chalk.green(CloudFrontSecureURL));
      } else {
        const { WebsiteURL } = context.exeInfo.serviceMeta.output;
        context.print.info('Your app is published successfully.');
        context.print.info(chalk.green(WebsiteURL));
        opn(WebsiteURL, { wait: false });
      }
    })
    .catch((e) => {
      spinner.fail('Error has occured during publish.');
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
  opn(consoleUrl, { wait: false });
}

module.exports = {
  enable,
  configure,
  publish,
  console,
};
