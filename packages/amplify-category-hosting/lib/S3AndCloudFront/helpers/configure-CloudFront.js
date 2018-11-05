const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const originErrorCodes = {
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Mothod Not Allowed',
  414: 'Request-URI Too Long',
  416: 'Requested Range Not Satisfiable',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

async function configure(context) {
  const templateFilePath = path.join(__dirname, '../template.json');
  const originalTemplate = JSON.parse(fs.readFileSync(templateFilePath));
  if (!context.exeInfo.template.Resources.CloudFrontDistribution) {
    context.print.info('CloudFront is NOT in the current hosting');
    const answer = await inquirer.prompt({
      name: 'AddCloudFront',
      type: 'confirm',
      message: 'Add CloudFront to hosting',
      default: false,
    });
    if (answer.AddCloudFront) {
      const {
        CloudFrontDistribution,
        OriginAccessIdentity,
        PrivateBucketPolicy,
      } = originalTemplate.Resources;
      const { Outputs } = originalTemplate;
      context.exeInfo.template.Resources.OriginAccessIdentity = OriginAccessIdentity;
      context.exeInfo.template.Resources.CloudFrontDistribution = CloudFrontDistribution;
      context.exeInfo.template.Resources.PrivateBucketPolicy = PrivateBucketPolicy;
      context.exeInfo.template.Outputs.CloudFrontDistributionID = Outputs.CloudFrontDistributionID;
      context.exeInfo.template.Outputs.CloudFrontDomainName = Outputs.CloudFrontDomainName;
      context.exeInfo.template.Outputs.CloudFrontSecureURL = Outputs.CloudFrontSecureURL;
      delete context.exeInfo.template.Resources.BucketPolicy;
      delete context.exeInfo.template.Resources.S3Bucket.Properties.AccessControl;
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'RemoveCloudFront',
      type: 'confirm',
      message: 'Remove CloudFront from hosting',
      default: false,
    });
    if (answer.RemoveCloudFront) {
      const { BucketPolicy, S3Bucket } = originalTemplate.Resources;
      delete context.exeInfo.template.Resources.OriginAccessIdentity;
      delete context.exeInfo.template.Resources.CloudFrontDistribution;
      delete context.exeInfo.template.Resources.PrivateBucketPolicy;
      delete context.exeInfo.template.Outputs.CloudFrontDistributionID;
      delete context.exeInfo.template.Outputs.CloudFrontDomainName;
      delete context.exeInfo.template.Outputs.CloudFrontSecureURL;
      context.exeInfo.template.Resources.BucketPolicy = BucketPolicy;
      const { AccessControl } = S3Bucket.Properties;
      context.exeInfo.template.Resources.S3Bucket.Properties.AccessControl = AccessControl;
    }
  }

  if (context.exeInfo.template.Resources.CloudFrontDistribution) {
    const { DistributionConfig } =
                context.exeInfo.template.Resources.CloudFrontDistribution.Properties;

    const questions = [
      {
        name: 'DefaultRootObject',
        type: 'input',
        message: 'default object to return from origin',
        default: DistributionConfig.DefaultRootObject,
      },
      {
        name: 'DefaultCacheDefaultTTL',
        type: 'input',
        message: 'Default TTL for the default cache behavior',
        default: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
      },
      {
        name: 'DefaultCacheMaxTTL',
        type: 'input',
        message: 'Max TTL for the default cache behavior',
        default: DistributionConfig.DefaultCacheBehavior.MaxTTL,
      },
      {
        name: 'DefaultCacheMinTTL',
        type: 'input',
        message: 'Min TTL for the default cache behavior',
        default: DistributionConfig.DefaultCacheBehavior.MinTTL,
      },
      {
        name: 'ConfigCustomError',
        type: 'confirm',
        message: 'Configure Custom Error Responses',
        default: true,
      },
    ];

    const answers = await inquirer.prompt(questions);
    DistributionConfig.DefaultRootObject = answers.DefaultRootObject;
    DistributionConfig.DefaultCacheBehavior.DefaultTTL = answers.DefaultCacheDefaultTTL;
    DistributionConfig.DefaultCacheBehavior.MaxTTL = answers.DefaultCacheMaxTTL;
    DistributionConfig.DefaultCacheBehavior.MinTTL = answers.DefaultCacheMinTTL;

    if (answers.ConfigCustomError) {
      await configureCustomErrorResponse(DistributionConfig);
    }
  }

  return context;
}

async function configureCustomErrorResponse(DistributionConfig) {
  if (!DistributionConfig.CustomErrorResponses) {
    DistributionConfig.CustomErrorResponses = [];
  }
  const done = "I'm done.";
  const configActions = ['list', 'add', 'edit', 'remove', 'remove all', done];
  const answer = await inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'Please select the action on Custom Error Responses.',
    choices: configActions,
    default: configActions[0],
  });

  switch (answer.action) {
    case 'list':
      console.log();
      console.log(DistributionConfig.CustomErrorResponses);
      console.log();
      break;
    case 'add':
      await addCER(DistributionConfig.CustomErrorResponses);
      break;
    case 'edit':
      await editCER(DistributionConfig.CustomErrorResponses);
      break;
    case 'remove':
      await removeCER(DistributionConfig.CustomErrorResponses);
      break;
    case 'remove all':
      delete DistributionConfig.CustomErrorResponses;
      break;
    default:
      console.log();
      console.log(DistributionConfig.CustomErrorResponses);
      console.log();
      break;
  }

  if (!answer.action === done) {
    return configureCustomErrorResponse(DistributionConfig);
  }
  return DistributionConfig;
}

async function addCER(CustomErrorResponses) {
  const unConfiguredCodes = getUnConfiguredErrorCodes(CustomErrorResponses);
  if (unConfiguredCodes.length > 0) {
    const selection = await inquirer.prompt({
      name: 'ErrorCode',
      type: 'list',
      message: 'Please select the error code to add custom error response.',
      choices: unConfiguredCodes,
      default: unConfiguredCodes[0],
    });

    const questions = [
      {
        name: 'ResponseCode',
        type: 'input',
        message: 'Response code',
        default: 200,
      },
      {
        name: 'ResponsePagePath',
        type: 'input',
        message: 'Response page path',
        default: '/',
      },
      {
        name: 'ErrorCachingMinTTL',
        type: 'input',
        message: 'Error caching Min TTL in seconds',
        default: 300,
      },
    ];
    const answers = await await inquirer.prompt(questions);
    CustomErrorResponses.push({
      ErrorCachingMinTTL: parseInt(answers.ErrorCachingMinTTL, 10),
      ErrorCode: parseInt(selection.ErrorCode, 10),
      ResponseCode: parseInt(answers.ResponseCode, 10),
      ResponsePagePath: answers.ResponsePagePath,
    });
  } else {
    console.log('All configurable error codes from the origin have been mapped.');
    console.log('You can select to edit those custom error responses.');
  }
}

async function editCER(CustomErrorResponses) {
  const configuredCodes = getConfiguredErrorCodes(CustomErrorResponses);
  if (configuredCodes.length > 0) {
    const selection = await inquirer.prompt({
      name: 'ErrorCode',
      type: 'list',
      message: 'Please select the error code to edit its custom error response.',
      choices: configuredCodes,
      default: configuredCodes[0],
    });

    const i = getCerIndex(selection.ErrorCode, CustomErrorResponses);
    const questions = [
      {
        name: 'ResponseCode',
        type: 'input',
        message: 'Response code',
        default: CustomErrorResponses[i].ResponseCode,
      },
      {
        name: 'ResponsePagePath',
        type: 'input',
        message: 'Response page path',
        default: CustomErrorResponses[i].ResponsePagePath,
      },
      {
        name: 'ErrorCachingMinTTL',
        type: 'input',
        message: 'Error caching Min TTL in seconds',
        default: CustomErrorResponses[i].ErrorCachingMinTTL,
      },
    ];
    const answers = await await inquirer.prompt(questions);
    Object.assign(CustomErrorResponses[i], answers);
    CustomErrorResponses[i].ErrorCachingMinTTL = parseInt(answers.ErrorCachingMinTTL, 10);
    CustomErrorResponses[i].ErrorCode = parseInt(selection.ErrorCode, 10);
    CustomErrorResponses[i].ResponseCode = parseInt(answers.ResponseCode, 10);
    CustomErrorResponses[i].ResponsePagePath = answers.ResponsePagePath;
  } else {
    console.log('No configurable error code from the origin has been mapped.');
    console.log('You can select to add custom error responses.');
  }
}

async function removeCER(CustomErrorResponses) {
  const configuredCodes = getConfiguredErrorCodes(CustomErrorResponses);
  if (configuredCodes.length > 0) {
    const selection = await inquirer.prompt({
      name: 'ErrorCode',
      type: 'list',
      message: 'Please select the error code to remove its custom error response.',
      choices: configuredCodes,
      default: configuredCodes[0],
    });

    const i = getCerIndex(selection.ErrorCode, CustomErrorResponses);
    CustomErrorResponses.splice(i, 1);
  } else {
    console.log('No configurable error code from the origin has been mapped.');
  }
}

function getConfiguredErrorCodes(CustomErrorResponses) {
  const result = [];
  for (let i = 0; i < CustomErrorResponses.length; i++) {
    result.push((CustomErrorResponses[i].ErrorCode).toString());
  }
  return result;
}

function getCerIndex(errorCode, CustomErrorResponses) {
  let result = -1;
  for (let i = 0; i < CustomErrorResponses.length; i++) {
    if (errorCode === CustomErrorResponses[i].ErrorCode.toString()) {
      result = i;
      break;
    }
  }
  return result;
}

function getUnConfiguredErrorCodes(CustomErrorResponses) {
  const result = [];
  const allCodes = Object.keys(originErrorCodes);
  const configuredCodes = getConfiguredErrorCodes(CustomErrorResponses);

  for (let i = 0; i < allCodes.length; i++) {
    if (!configuredCodes.includes(allCodes[i])) {
      result.push(allCodes[i]);
    }
  }
  return result;
}

module.exports = {
  configure,
};
