const inquirer = require('inquirer');
const moment = require('moment');
const validateBucketName = require('./helpers/validate-bucket-name');

const configurables = {
  Website: './helpers/configure-Website',
  CloudFront: './helpers/configure-CloudFront',
  Publish: './helpers/configure-Publish',
};

async function init(context) {
  await setBucketName(context);
  const configureModule = require(configurables.Website);
  await configureModule.configure(context);
}

async function configure(context) {
  await checkBucketName(context);
  await configureHostingComponents(context);
}

async function checkBucketName(context) {
  const { serviceMeta } = context.exeInfo;
  const bucketCreated = serviceMeta && serviceMeta.output && serviceMeta.output.HostingBucketName;
  if (!bucketCreated) {
    await setBucketName(context, context.exeInfo.parameters.bucketName);
  }
}

async function configureHostingComponents(context, lastConfiguredSection) {
  const options = Object.keys(configurables);
  const done = 'exit';
  options.push(done);

  let defaultSection = options[0];
  if (lastConfiguredSection) {
    let index = 0;
    for (let i = 0; i < options.length; i++) {
      if (options[i] === lastConfiguredSection) {
        index = i;
        break;
      }
    }
    if (index < options.length - 1) {
      defaultSection = options[index + 1];
    }
  }

  const answer = await inquirer.prompt({
    type: 'list',
    name: 'section',
    message: 'Specify the section to configure',
    choices: options,
    default: defaultSection,
  });

  if (answer.section !== done) {
    const configureModule = require(configurables[answer.section]);
    await configureModule.configure(context);
    await configureHostingComponents(context, answer.section);
  }
}

async function setBucketName(context, bucketName) {
  if (!bucketName) {
    const { projectConfig } = context.exeInfo;
    const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}-`;
    bucketName = `${projectConfig.projectName + timeStamp}hostingbucket`;
  }

  bucketName = bucketName.replace(/[^-a-z0-9]/g, '');

  const questions = [{
    name: 'HostingBucketName',
    type: 'input',
    message: 'hosting bucket name',
    default: bucketName,
    validate: validateBucketName,
  }];

  const answers = await inquirer.prompt(questions);

  context.exeInfo.parameters.bucketName = answers.HostingBucketName;
}

module.exports = {
  init,
  configure,
};
