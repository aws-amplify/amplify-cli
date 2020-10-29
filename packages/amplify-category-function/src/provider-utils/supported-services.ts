import { migrate, createWalkthrough, updateWalkthrough } from './awscloudformation/service-walkthroughs/lambda-walkthrough';
import { createLayerWalkthrough, updateLayerWalkthrough } from './awscloudformation/service-walkthroughs/lambdaLayerWalkthrough';
import { createContainerWalkthrough, updateContainerWalkthrough } from './awscloudformation/service-walkthroughs/containers-walkthrough';
import * as lambdaController from './awscloudformation';
import { SupportedServices } from './supportedServicesType';
import { getIAMPolicies } from './awscloudformation/utils/cloudformationHelpers';
import { askExecRolePermissionsQuestions } from './awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
import { FeatureFlags } from 'amplify-cli-core';

const supportedServices: SupportedServices = {
  Lambda: {
    alias: 'Lambda function (serverless function)',
    walkthroughs: {
      createWalkthrough: createWalkthrough,
      updateWalkthrough: updateWalkthrough,
      migrate: migrate,
      getIAMPolicies: getIAMPolicies,
      askExecRolePermissionsQuestions: askExecRolePermissionsQuestions,
    },
    cfnFilename: `${__dirname}/../../resources/awscloudformation/cloudformation-templates/lambda-function-cloudformation-template.json.ejs`,
    provider: 'awscloudformation',
    providerController: lambdaController,
  },
  LambdaLayer: {
    alias: 'Lambda layer (shared code & resource used across functions)',
    walkthroughs: {
      createWalkthrough: createLayerWalkthrough,
      updateWalkthrough: updateLayerWalkthrough,
    },
    provider: 'awscloudformation',
    providerController: lambdaController,
  },
};

if (FeatureFlags.getBoolean('advancedCompute.enabled')) {
  supportedServices.ElasticContainer = {
    alias: 'Fargate task (container-based)',
    walkthroughs: {
      createWalkthrough: createContainerWalkthrough,
      updateWalkthrough: updateContainerWalkthrough,
    },
    provider: 'awscloudformation',
    providerController: lambdaController,
  };

}

export { supportedServices };