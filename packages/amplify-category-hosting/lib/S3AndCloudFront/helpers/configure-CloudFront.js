const path = require('path');
const { prompter, byValue } = require('@aws-amplify/amplify-prompts');

const originErrorCodes = {
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
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
  const originalTemplate = context.amplify.readJsonFile(templateFilePath);
  if (!context.exeInfo.template.Resources.CloudFrontDistribution) {
    context.print.info('CloudFront is NOT in the current hosting');
    const addCloudFront = await prompter.yesOrNo('Add CloudFront to hosting', false);
    if (addCloudFront) {
      const { CloudFrontDistribution, OriginAccessIdentity, PrivateBucketPolicy } = originalTemplate.Resources;
      const { Outputs } = originalTemplate;
      context.exeInfo.template.Resources.OriginAccessIdentity = OriginAccessIdentity;
      context.exeInfo.template.Resources.CloudFrontDistribution = CloudFrontDistribution;
      context.exeInfo.template.Resources.PrivateBucketPolicy = PrivateBucketPolicy;
      context.exeInfo.template.Outputs.CloudFrontDistributionID = Outputs.CloudFrontDistributionID;
      context.exeInfo.template.Outputs.CloudFrontDomainName = Outputs.CloudFrontDomainName;
      context.exeInfo.template.Outputs.CloudFrontSecureURL = Outputs.CloudFrontSecureURL;
      context.exeInfo.template.Outputs.CloudFrontOriginAccessIdentity = Outputs.CloudFrontOriginAccessIdentity;
      delete context.exeInfo.template.Resources.S3Bucket.Properties.WebsiteConfiguration;
      // Don't remove the following line,
      // customer projects setup by the CLI prior to 2/22/2019 has this resource
      delete context.exeInfo.template.Resources.BucketPolicy;
      delete context.exeInfo.template.Resources.S3Bucket.Properties.AccessControl;
    }
  }

  if (context.exeInfo.template.Resources.CloudFrontDistribution) {
    const { DistributionConfig } = context.exeInfo.template.Resources.CloudFrontDistribution.Properties;

    DistributionConfig.DefaultRootObject = await prompter.input('default object to return from origin', {
      initial: DistributionConfig.DefaultRootObject,
    });
    DistributionConfig.DefaultCacheBehavior.DefaultTTL = await prompter.input('Default TTL for the default cache behavior', {
      initial: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
    });
    DistributionConfig.DefaultCacheBehavior.MaxTTL = await prompter.input('Max TTL for the default cache behavior', {
      initial: DistributionConfig.DefaultCacheBehavior.MaxTTL,
    });
    DistributionConfig.DefaultCacheBehavior.MinTTL = await prompter.input('Min TTL for the default cache behavior', {
      initial: DistributionConfig.DefaultCacheBehavior.MinTTL,
    });

    if (await prompter.yesOrNo('Configure Custom Error Responses', true)) {
      await configureCustomErrorResponse(context, DistributionConfig);
    }
  }

  return context;
}

async function configureCustomErrorResponse(context, DistributionConfig) {
  if (!DistributionConfig.CustomErrorResponses) {
    DistributionConfig.CustomErrorResponses = [];
  }
  const done = 'exit';
  const configActions = ['list', 'add', 'edit', 'remove', 'remove all', done];
  const action = await prompter.pick('Please select the action on Custom Error Responses.', configActions, {
    initial: byValue(configActions[0]),
  });
  switch (action) {
    case 'list':
      listCustomErrorResponses(context, DistributionConfig.CustomErrorResponses);
      break;
    case 'add':
      await addCER(context, DistributionConfig.CustomErrorResponses);
      break;
    case 'edit':
      await editCER(context, DistributionConfig.CustomErrorResponses);
      break;
    case 'remove':
      await removeCER(context, DistributionConfig.CustomErrorResponses);
      break;
    case 'remove all':
      DistributionConfig.CustomErrorResponses.length = 0;
      break;
    default:
      listCustomErrorResponses(context, DistributionConfig.CustomErrorResponses);
      break;
  }

  if (action !== done) {
    await configureCustomErrorResponse(context, DistributionConfig);
  }
}

function listCustomErrorResponses(context, CustomErrorResponses) {
  context.print.info('');
  context.print.info(CustomErrorResponses);
  context.print.info('');
}

async function addCER(context, CustomErrorResponses) {
  const unConfiguredCodes = getUnConfiguredErrorCodes(CustomErrorResponses);
  if (unConfiguredCodes.length > 0) {
    CustomErrorResponses.push({
      ErrorCode: await prompter.pick('Please select the error code to add custom error response.', unConfiguredCodes, {
        initial: byValue(unConfiguredCodes[0]),
        transform: (input) => parseInt(input, 10),
      }),
      ResponseCode: await prompter.input('Response code', { initial: 200, transform: (input) => parseInt(input, 10) }),
      ResponsePagePath: await prompter.input('Response page path', { initial: '/' }),
      ErrorCachingMinTTL: await prompter.input('Error caching Min TTL in seconds', {
        initial: 300,
        transform: (input) => parseInt(input, 10),
      }),
    });
  } else {
    context.print.info('All configurable error codes from the origin have been mapped.');
    context.print.info('You can select to edit those custom error responses.');
  }
}

async function editCER(context, CustomErrorResponses) {
  const configuredCodes = getConfiguredErrorCodes(CustomErrorResponses);
  if (configuredCodes.length > 0) {
    const errorCode = await prompter.pick('Please select the error code to edit its custom error response.', configuredCodes, {
      initial: byValue(configuredCodes[0]),
      transform: (input) => parseInt(input, 10),
    });
    const i = getCerIndex(errorCode, CustomErrorResponses);
    CustomErrorResponses[i].ErrorCode = errorCode;
    CustomErrorResponses[i].ResponseCode = await prompter.input('Response code', {
      initial: CustomErrorResponses[i].ResponseCode,
      transform: (input) => parseInt(input, 10),
    });
    CustomErrorResponses[i].ResponsePagePath = await prompter.input('Response page path', {
      initial: CustomErrorResponses[i].ResponsePagePath,
    });
    CustomErrorResponses[i].ErrorCachingMinTTL = await prompter.input('Error caching Min TTL in seconds', {
      initial: CustomErrorResponses[i].ErrorCachingMinTTL,
      transform: (input) => parseInt(input, 10),
    });
  } else {
    context.print.info('No configurable error code from the origin has been mapped.');
    context.print.info('You can select to add custom error responses.');
  }
}

async function removeCER(context, CustomErrorResponses) {
  const configuredCodes = getConfiguredErrorCodes(CustomErrorResponses);
  if (configuredCodes.length > 0) {
    const selection = await prompter.pick('Please select the error code to remove its custom error response.', configuredCodes, {
      initial: configuredCodes[0],
    });

    const i = getCerIndex(selection, CustomErrorResponses);
    CustomErrorResponses.splice(i, 1);
  } else {
    context.print.info('No configurable error code from the origin has been mapped.');
  }
}

function getConfiguredErrorCodes(CustomErrorResponses) {
  const result = [];
  for (let i = 0; i < CustomErrorResponses.length; i++) {
    result.push(CustomErrorResponses[i].ErrorCode.toString());
  }
  return result;
}

function getCerIndex(errorCode, CustomErrorResponses) {
  let result = -1;
  for (let i = 0; i < CustomErrorResponses.length; i++) {
    if (errorCode.toString() === CustomErrorResponses[i].ErrorCode.toString()) {
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
