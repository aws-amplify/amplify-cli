const inquirer = require('inquirer');
const moment = require('moment');

const configurables = {
  Website: './helpers/configure-Website',
  CloudFront: './helpers/configure-CloudFront',
  Publish: './helpers/configure-Publish',
};

async function init(context) {
  const { projectConfig } = context.exeInfo;
  const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}-`;
  let bucketName = `${projectConfig.projectName + timeStamp}-hostingbucket`;
  bucketName = bucketName.replace(/[^-a-z0-9]/g, '');

  const questions = [{
    name: 'HostingBucketName',
    type: 'input',
    message: 'hosting bucket name',
    default: bucketName,
  }];

  const answers = await inquirer.prompt(questions);

  context.exeInfo.template.Resources.S3Bucket.Properties.BucketName = answers.HostingBucketName;

  const configureModule = require(configurables.Website);
  await configureModule.configure(context);
}

async function configure(context, lastConfiguredSection) {
  const options = Object.keys(configurables);
  const done = "I'm done.";
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
    return configure(context, answer.section);
  }
  return context;
}

module.exports = {
  init,
  configure,
};
