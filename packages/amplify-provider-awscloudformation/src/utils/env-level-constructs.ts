const fs = require('fs-extra');
const path = require('path');
const { S3 } = require('../aws-utils/aws-s3');
const constants = require('../constants');
const { NetworkStack } = require('../network/stack');
const { getEnvironmentNetworkInfo } = require('../network/environment-info');

const { ProviderName: providerName } = constants;

export async function createEnvLevelConstructs(context) {
  const { StackName: stackName } = context.amplify.getProjectMeta().providers[constants.ProviderName];

  const hasContainers = envHasContainers(context);

  const updatedMeta = {};

  Object.assign(updatedMeta, await createNetworkResources(context, stackName, hasContainers));

  context.amplify.updateProvideramplifyMeta(providerName, updatedMeta);

  if (hasContainers) {
    const containerResourcesFilenames = ['custom-resource-pipeline-awaiter.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
    for (const file of containerResourcesFilenames) {
      await uploadResourceFile(context, file);
    }
  }
}

async function createNetworkResources(context: any, stackName: string, needsVpc: boolean) {
  if (!needsVpc) {
    return {
      NetworkStackS3Url: undefined,
    };
  }
  const vpcName = 'Amplify/VPC-do-not-delete';

  const { vpcId, internetGatewayId, subnetCidrs } = await getEnvironmentNetworkInfo(context, {
    stackName,
    vpcName,
    vpcCidr: '10.0.0.0/16',
    subnetsCount: 3,
    subnetMask: 24,
  });

  const stack = new NetworkStack(undefined, 'Amplify', {
    stackName,
    vpcName,
    vpcId,
    internetGatewayId,
    subnetCidrs,
  });

  const cfn = stack.toCloudFormation();

  const cfnFile = 'networkingStackTemplate.json';

  const s3 = await S3.getInstance(context);

  const s3Params = {
    Body: JSON.stringify(cfn, null, 2),
    Key: `amplify-cfn-templates/${cfnFile}`,
  };

  const projectBucket = await s3.uploadFile(s3Params);
  const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${cfnFile}`;

  return {
    NetworkStackS3Url: templateURL,
  };
}

function envHasContainers(context: any) {
  const { function: functionsObj, api: apiObj } = context.amplify.getProjectMeta();

  if (functionsObj) {
    const found = Object.keys(functionsObj).some(key => {
      const func = functionsObj[key];
      if (func.providerPlugin === providerName && func.service === 'ElasticContainer') {
        if (func.scheduleOptions && func.scheduleOptions.cloudwatchRule) {
          return true;
        }
      }
    });

    if (found) {
      return true;
    }
  }

  if (apiObj) {
    const found = Object.keys(apiObj).some(key => {
      const api = apiObj[key];
      if (api.providerPlugin === providerName && api.service === 'ElasticContainer') {
        return true;
      }
    });

    if (found) {
      return true;
    }
  }

  return false;
}

async function uploadResourceFile(context, fileName) {
  const filePath = path.join(__dirname, '../..', 'resources', fileName);

  const s3 = await S3.getInstance(context);

  // TODO: check if already exists
  const s3Params = {
    Body: fs.createReadStream(filePath),
    Key: fileName,
  };

  const result = s3.uploadFile(s3Params, true);

  return result;
}
