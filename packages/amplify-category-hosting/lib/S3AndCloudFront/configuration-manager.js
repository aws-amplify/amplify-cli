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
  let bucketName = `${projectConfig.projectName + timeStamp}hostingbucket`;
  bucketName = bucketName.replace(/[^-a-z0-9]/g, '');

  const questions = [{
    name: 'HostingBucketName',
    type: 'input',
    message: 'hosting bucket name',
    default: bucketName,
    validate: (value) => {
      let isValid =
      typeof value === 'string' &&
      value.length >= 3 &&
      value.length <= 63 &&
      /^[a-z0-9.-]*$/.test(value);

      if (!isValid) {
        return 'The bucket name must be a string between 3 and 63 characters long, and can contain only lower-case characters, numbers, periods, and dashes.';
      }

      isValid = /^[a-z0-9]/.test(value);
      if (!isValid) {
        return 'The bucket name must start with a lowercase letter or number.';
      }

      isValid = !/-$/.test(value);
      if (!isValid) {
        return 'The bucket name cannot end with a dash.';
      }

      isValid = !/\.{2,}/.test(value);
      if (!isValid) {
        return 'The bucket name cannot have consecutive periods.';
      }

      isValid = !/\.-|-\./.test(value);
      if (!isValid) {
        return 'The bucket name cannot have dashes adjacent to periods.';
      }

      isValid = !(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(value));
      if (!isValid) {
        return 'The bucket name cannot be formatted as an IP address.';
      }

      return true;
    },
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
