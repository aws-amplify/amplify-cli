import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { S3 } from '../aws-utils/aws-s3';
import constants from '../constants';
import { getEnvironmentNetworkInfo } from '../network/environment-info';
import { NetworkStack } from '../network/stack';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import { consolidateApiGatewayPolicies } from './consolidate-apigw-policies';
// eslint-disable-next-line import/no-cycle
import { uploadAuthTriggerTemplate } from './upload-auth-trigger-template';

const { ProviderName: providerName } = constants;

/**
 * creates env levels constructs
 */
export const createEnvLevelConstructs = async (context: $TSContext): Promise<void> => {
  const { StackName: stackName } = context.amplify.getProjectMeta().providers[constants.ProviderName];

  const hasContainers = envHasContainers(context);

  const updatedMeta = {};

  Object.assign(
    updatedMeta,
    await createNetworkResources(context, stackName, hasContainers),
    await consolidateApiGatewayPolicies(context, stackName),
    await uploadAuthTriggerTemplate(context),
  );

  context.amplify.updateProviderAmplifyMeta(providerName, updatedMeta);

  if (hasContainers) {
    const containerResourcesFilenames = ['custom-resource-pipeline-awaiter-18.zip', 'codepipeline-action-buildspec-generator-lambda.zip'];
    for (const file of containerResourcesFilenames) {
      await uploadResourceFile(context, file);
    }
  }
};

const createNetworkResources = async (
  context: $TSContext,
  stackName: string,
  needsVpc: boolean,
): Promise<{ NetworkStackS3Url: string }> => {
  if (!needsVpc) {
    return {
      NetworkStackS3Url: undefined,
    };
  }
  const cfn = await getNetworkResourceCfn(context, stackName);
  await prePushCfnTemplateModifier(cfn);

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
};

/**
 * get the network resource cfn
 */
export const getNetworkResourceCfn = async (context: $TSContext, stackName: string): Promise<$TSAny> => {
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

  return stack.toCloudFormation();
};

const envHasContainers = (context: $TSContext): boolean => {
  const { api: apiObj, hosting: hostingObj } = context.amplify.getProjectMeta();

  if (apiObj) {
    // eslint-disable-next-line consistent-return, array-callback-return
    const found = Object.keys(apiObj).some((key) => {
      const api = apiObj[key];
      if (api.providerPlugin === providerName && api.service === 'ElasticContainer') {
        return true;
      }
    });

    if (found) {
      return true;
    }
  }

  if (hostingObj) {
    // eslint-disable-next-line consistent-return, array-callback-return
    const found = Object.keys(hostingObj).some((key) => {
      const hosting = hostingObj[key];
      if (hosting.providerPlugin === providerName && hosting.service === 'ElasticContainer') {
        return true;
      }
    });

    if (found) {
      return true;
    }
  }

  return false;
};

const uploadResourceFile = async (context: $TSContext, fileName: string): Promise<string> => {
  const filePath = path.join(__dirname, '..', '..', 'resources', fileName);
  const s3 = await S3.getInstance(context);

  // TODO: check if already exists
  const s3Params = {
    Body: fs.createReadStream(filePath),
    Key: fileName,
  };

  return s3.uploadFile(s3Params, true);
};
